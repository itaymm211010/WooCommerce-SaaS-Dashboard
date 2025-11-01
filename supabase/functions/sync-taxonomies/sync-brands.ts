import { createSupabaseClient, formatBaseUrl, fetchWithRetry } from "./utils.ts"

interface WooBrand {
  id: number
  name: string
  slug: string
  description?: string
  count?: number
  image?: { src?: string }
}

export async function syncBrands(store: any, storeId: string) {
  const supabase = createSupabaseClient()
  const baseUrl = formatBaseUrl(store.url)
  
  let allBrands: WooBrand[] = []
  let page = 1
  let hasMore = true
  let created = 0
  let updated = 0
  let failed = 0
  const errors: any[] = []
  
  console.log('🏷️ Starting brands sync...')
  
  // Note: Brands endpoint requires WooCommerce 9.0+
  while (hasMore) {
    try {
      const url = `${baseUrl}/wp-json/wc/v3/products/brands?per_page=100&page=${page}&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`
      
      const response = await fetchWithRetry(url, {
        headers: { 'Accept': 'application/json' }
      })
      
      const brands = await response.json() as WooBrand[]
      allBrands.push(...brands)
      
      console.log(`✅ Loaded page ${page} - ${brands.length} brands`)
      
      const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1')
      hasMore = page < totalPages
      page++
      
    } catch (error: any) {
      // Brands endpoint might not exist (WooCommerce < 9.0)
      if (error.message.includes('404')) {
        console.log('⚠️ Brands endpoint not available (WooCommerce < 9.0)')
        break
      }
      
      console.error(`❌ Failed to fetch brands page ${page}:`, error)
      failed++
      errors.push({ page, error: error.message })
      break
    }
  }
  
  console.log(`📊 Total brands fetched: ${allBrands.length}`)
  
  for (const brand of allBrands) {
    try {
      const { data: existing } = await supabase
        .from('store_brands')
        .select('id')
        .eq('store_id', storeId)
        .eq('woo_id', brand.id)
        .single()
      
      const brandData = {
        store_id: storeId,
        woo_id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description || null,
        logo_url: brand.image?.src || null,
        count: brand.count || 0,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString()
      }
      
      if (existing) {
        await supabase
          .from('store_brands')
          .update(brandData)
          .eq('id', existing.id)
        updated++
      } else {
        await supabase
          .from('store_brands')
          .insert(brandData)
        created++
      }
      
    } catch (error: any) {
      console.error(`❌ Failed to sync brand "${brand.name}":`, error)
      failed++
      errors.push({ brand: brand.name, error: error.message })
    }
  }
  
  console.log(`✅ Brands sync complete: ${created} created, ${updated} updated, ${failed} failed`)
  
  return { created, updated, failed, errors: errors.length > 0 ? errors : undefined }
}
