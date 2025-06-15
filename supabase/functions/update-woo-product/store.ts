
import { createSupabaseClient, createResponse } from "./utils.ts"

// Get store details from the database
export async function getStoreDetails(storeId: string) {
  const supabase = createSupabaseClient()
  
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single()

  if (storeError || !store) {
    throw new Error(`Store not found: ${storeError?.message || 'Unknown error'}`)
  }

  if (!store.url || !store.api_key || !store.api_secret) {
    throw new Error('Missing store configuration')
  }

  return store
}
