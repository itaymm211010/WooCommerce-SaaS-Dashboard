import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Get store details with credentials using secure RPC function
 * This function handles both basic store info and sensitive credentials
 */
export async function getStoreDetails(storeId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Get full store details using service role (bypasses RLS)
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
