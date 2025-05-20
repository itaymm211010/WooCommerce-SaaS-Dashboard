
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

// Update store currency if it changed in WooCommerce
export async function checkAndUpdateCurrency(store: any, baseUrl: string) {
  try {
    const supabase = createSupabaseClient()
    const currencyResponse = await fetch(
      `${baseUrl}/wp-json/wc/v3/settings/general?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    if (currencyResponse.ok) {
      const settings = await currencyResponse.json()
      const currencySetting = settings.find((setting: any) => setting.id === 'woocommerce_currency')
      
      if (currencySetting && currencySetting.value !== store.currency) {
        console.log(`Currency changed from ${store.currency} to ${currencySetting.value}, updating...`)
        await supabase
          .from('stores')
          .update({ currency: currencySetting.value })
          .eq('id', store.id)
      }
    }
  } catch (error) {
    console.error('Error checking store currency:', error)
    // Continue with product sync even if currency check fails
  }
}
