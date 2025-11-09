import { createResponse } from "./utils.ts"
import { getStoreDetails } from "./store.ts"
import { fetchProducts, fetchProductsWithVariations, saveProducts } from "./products.ts"
import { logSyncStart, logSyncSuccess, logSyncError } from "../shared/sync-logger.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

// Main request handler
export async function handleRequest(req: Request) {
  const { store_id } = await req.json()
  
  if (!store_id) {
    throw new Error('No store_id provided')
  }

  console.log(`Processing sync request for store_id: ${store_id}`)

  // Create service role client for logging
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const startTime = Date.now()
  const logId = await logSyncStart(supabaseAdmin, {
    store_id,
    entity_type: 'product',
    action: 'sync'
  })

  // Get store details
  const store = await getStoreDetails(store_id)
  
  try {
    // Fetch products from WooCommerce
    const products = await fetchProducts(store)
    
    // Add variations for variable products
    const productsWithVariations = await fetchProductsWithVariations(products, store)
    
    // Save products to the database
    await saveProducts(productsWithVariations, store_id)
    
    const duration = Date.now() - startTime
    
    if (logId) {
      await logSyncSuccess(supabaseAdmin, logId, {
        duration_ms: duration,
        metadata: { 
          products_count: products.length,
          variations_count: productsWithVariations.reduce((sum, p) => sum + (p.variations?.length || 0), 0)
        }
      })
    }
    
    return createResponse({ 
      success: true,
      message: 'Products and images synced successfully',
      count: products.length
    }, 200)
    
  } catch (fetchError) {
    console.error('Error fetching products from WooCommerce:', fetchError)
    
    if (logId) {
      await logSyncError(supabaseAdmin, {
        store_id,
        entity_type: 'product',
        error_message: fetchError instanceof Error ? fetchError.message : 'Unknown error fetching products',
        stack_trace: fetchError instanceof Error ? fetchError.stack : undefined
      }, logId)
    }
    
    return createResponse({ 
      error: fetchError instanceof Error ? fetchError.message : 'Unknown error fetching products'
    }, 500)
  }
}
