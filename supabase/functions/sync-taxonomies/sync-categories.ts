import { createSupabaseClient, formatBaseUrl, fetchWithRetry } from "./utils.ts"

interface WooCategory {
  id: number
  name: string
  slug: string
  description?: string
  parent?: number
  count?: number
  image?: { src?: string }
  display?: string
  menu_order?: number
}

export async function syncCategories(store: any, storeId: string) {
  const supabase = createSupabaseClient()
  const baseUrl = formatBaseUrl(store.url)
  
  let allCategories: WooCategory[] = []
  let page = 1
  let hasMore = true
  let created = 0
  let updated = 0
  let failed = 0
  const errors: any[] = []
  
  console.log('🏷️ Starting categories sync...')
  
  // Pagination loop
  while (hasMore) {
    try {
      const url = `${baseUrl}/wp-json/wc/v3/products/categories?per_page=100&page=${page}&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`
      
      const response = await fetchWithRetry(url, {
        headers: { 'Accept': 'application/json' }
      })
      
      const categories = await response.json() as WooCategory[]
      allCategories.push(...categories)
      
      console.log(`✅ Loaded page ${page} - ${categories.length} categories`)
      
      const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1')
      hasMore = page < totalPages
      page++
      
    } catch (error: any) {
      console.error(`❌ Failed to fetch categories page ${page}:`, error)
      failed++
      errors.push({ page, error: error.message })
      break
    }
  }
  
  console.log(`📊 Total categories fetched: ${allCategories.length}`)
  
  // Upsert to DB
  for (const cat of allCategories) {
    try {
      const { data: existing } = await supabase
        .from('store_categories')
        .select('id')
        .eq('store_id', storeId)
        .eq('woo_id', cat.id)
        .single()
      
      const categoryData = {
        store_id: storeId,
        woo_id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        parent_woo_id: cat.parent || null,
        image_url: cat.image?.src || null,
        count: cat.count || 0,
        display: cat.display || 'default',
        menu_order: cat.menu_order || 0,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString()
      }
      
      if (existing) {
        await supabase
          .from('store_categories')
          .update(categoryData)
          .eq('id', existing.id)
        updated++
      } else {
        await supabase
          .from('store_categories')
          .insert(categoryData)
        created++
      }
      
    } catch (error: any) {
      console.error(`❌ Failed to sync category "${cat.name}":`, error)
      failed++
      errors.push({ category: cat.name, error: error.message })
    }
  }
  
  // מחק קטגוריות שלא קיימות יותר בווקומרס
  let deleted = 0
  try {
    const wooIds = allCategories.map(cat => cat.id)
    
    if (wooIds.length > 0) {
      const { data: deleted_cats } = await supabase
        .from('store_categories')
        .delete()
        .eq('store_id', storeId)
        .not('woo_id', 'in', `(${wooIds.join(',')})`)
        .select('id')
      
      deleted = deleted_cats?.length || 0
      if (deleted > 0) {
        console.log(`🗑️ Deleted ${deleted} categories that no longer exist in WooCommerce`)
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to delete orphaned categories:', error)
  }
  
  // Update parent_id relationships
  await updateCategoryHierarchy(storeId)
  
  console.log(`✅ Categories sync complete: ${created} created, ${updated} updated, ${deleted} deleted, ${failed} failed`)
  
  return { created, updated, deleted, failed, errors: errors.length > 0 ? errors : undefined }
}

async function updateCategoryHierarchy(storeId: string) {
  const supabase = createSupabaseClient()
  
  try {
    const { data: categories } = await supabase
      .from('store_categories')
      .select('id, woo_id, parent_woo_id')
      .eq('store_id', storeId)
      .not('parent_woo_id', 'is', null)
    
    if (!categories || categories.length === 0) return
    
    console.log(`🔗 Updating hierarchy for ${categories.length} categories...`)
    
    for (const cat of categories) {
      const { data: parent } = await supabase
        .from('store_categories')
        .select('id')
        .eq('store_id', storeId)
        .eq('woo_id', cat.parent_woo_id)
        .single()
      
      if (parent) {
        await supabase
          .from('store_categories')
          .update({ parent_id: parent.id })
          .eq('id', cat.id)
      }
    }
    
    console.log('✅ Hierarchy updated')
  } catch (error) {
    console.error('❌ Failed to update hierarchy:', error)
  }
}
