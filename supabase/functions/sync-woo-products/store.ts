
import { createSupabaseClient, createResponse } from "./utils.ts"
export { getStoreDetails } from "../_shared/store-utils.ts"

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
