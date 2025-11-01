import { createSupabaseClient, formatBaseUrl, fetchWithRetry } from "./utils.ts"

interface WooTag {
  id: number
  name: string
  slug: string
  description?: string
  count?: number
}

export async function syncTags(store: any, storeId: string) {
  const supabase = createSupabaseClient()
  const baseUrl = formatBaseUrl(store.url)
  
  let allTags: WooTag[] = []
  let page = 1
  let hasMore = true
  let created = 0
  let updated = 0
  let failed = 0
  const errors: any[] = []
  
  console.log('🏷️ Starting tags sync...')
  
  while (hasMore) {
    try {
      const url = `${baseUrl}/wp-json/wc/v3/products/tags?per_page=100&page=${page}&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`
      
      const response = await fetchWithRetry(url, {
        headers: { 'Accept': 'application/json' }
      })
      
      const tags = await response.json() as WooTag[]
      allTags.push(...tags)
      
      console.log(`✅ Loaded page ${page} - ${tags.length} tags`)
      
      const totalPages = parseInt(response.headers.get('x-wp-totalpages') || '1')
      hasMore = page < totalPages
      page++
      
    } catch (error: any) {
      console.error(`❌ Failed to fetch tags page ${page}:`, error)
      failed++
      errors.push({ page, error: error.message })
      break
    }
  }
  
  console.log(`📊 Total tags fetched: ${allTags.length}`)
  
  for (const tag of allTags) {
    try {
      const { data: existing } = await supabase
        .from('store_tags')
        .select('id')
        .eq('store_id', storeId)
        .eq('woo_id', tag.id)
        .single()
      
      const tagData = {
        store_id: storeId,
        woo_id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description || null,
        count: tag.count || 0,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString()
      }
      
      if (existing) {
        await supabase
          .from('store_tags')
          .update(tagData)
          .eq('id', existing.id)
        updated++
      } else {
        await supabase
          .from('store_tags')
          .insert(tagData)
        created++
      }
      
    } catch (error: any) {
      console.error(`❌ Failed to sync tag "${tag.name}":`, error)
      failed++
      errors.push({ tag: tag.name, error: error.message })
    }
  }
  
  console.log(`✅ Tags sync complete: ${created} created, ${updated} updated, ${failed} failed`)
  
  return { created, updated, failed, errors: errors.length > 0 ? errors : undefined }
}
