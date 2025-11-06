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

  // Get basic store info
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name, url, user_id, currency, created_at, updated_at')
    .eq('id', storeId)
    .single()

  if (storeError || !store) {
    throw new Error(`Store not found: ${storeError?.message || 'Unknown error'}`)
  }

  // Get credentials using the secure RPC function
  const { data: credentials, error: credError } = await supabase
    .rpc('get_store_credentials', { store_uuid: storeId })
    .single() as { data: { api_key: string; api_secret: string; webhook_secret: string | null } | null; error: any }

  if (credError || !credentials) {
    throw new Error(`Failed to get store credentials: ${credError?.message || 'Unknown error'}`)
  }

  if (!store.url || !credentials.api_key || !credentials.api_secret) {
    throw new Error('Missing store configuration')
  }

  // Combine store info with credentials
  return {
    ...store,
    api_key: credentials.api_key,
    api_secret: credentials.api_secret,
    webhook_secret: credentials.webhook_secret
  }
}
