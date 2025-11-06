
import { createResponse, createSupabaseClient } from "./utils.ts"
import { getStoreDetails } from "./store.ts"
import {
  createWooCommerceProduct,
  updateWooCommerceProduct,
  updateProductWooId,
  createWooCommerceVariation,
  updateWooCommerceVariation,
  updateVariationWooId,
  updateVariationPrice,
  syncVariationsFromWooCommerce
} from "./product.ts"
import { logSyncStart, logSyncSuccess, logSyncError } from "../_shared/sync-logger.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

// Main request handler
export async function handleRequest(req: Request) {
  const { product, store_id } = await req.json()
  
  if (!store_id || !product) {
    throw new Error('Missing required parameters: store_id or product')
  }

  console.log(`Processing product update for store_id: ${store_id}, product: ${product.id}`)

  // Create service role client for logging
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const startTime = Date.now()

  // Get store details
  const store = await getStoreDetails(store_id)
  const supabase = createSupabaseClient()
  
  // Fetch full product details from database if only ID was provided
  let fullProduct = product
  if (!product.name || !product.type) {
    const { data: dbProduct, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product.id)
      .eq('store_id', store_id)
      .single()
    
    if (productError || !dbProduct) {
      throw new Error(`Failed to fetch product: ${productError?.message}`)
    }
    
    fullProduct = dbProduct
    console.log(`Fetched full product details from database: ${fullProduct.name}`)
  }
  
  // Fetch product images
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', fullProduct.id)
    .eq('store_id', store_id)
    .order('display_order', { ascending: true })

  // Fetch product attributes (for variable products)
  const { data: attributes } = await supabase
    .from('product_attributes')
    .select('*')
    .eq('product_id', fullProduct.id)
    .eq('store_id', store_id)
    .order('position', { ascending: true })

  // Add images and attributes to product object
  const productWithImages = {
    ...fullProduct,
    images: images || [],
    attributes: attributes || []
  }

  const wooId = fullProduct.woo_id

  // If no WooCommerce ID, create new product
  if (!wooId || wooId === 0) {
    const logId = await logSyncStart(supabaseAdmin, {
      store_id,
      entity_type: 'product',
      action: 'create_in_woo',
      entity_id: fullProduct.id
    })

    try {
      const newWooProduct = await createWooCommerceProduct(store, productWithImages)
      
      // Update the product in our database with the new WooCommerce ID
      await updateProductWooId(supabase, fullProduct.id, newWooProduct.id)

      const duration = Date.now() - startTime
      if (logId) {
        await logSyncSuccess(supabaseAdmin, logId, {
          duration_ms: duration,
          woo_id: newWooProduct.id,
          metadata: { product_name: fullProduct.name }
        })
      }

      return createResponse({ 
        success: true,
        message: 'Product created successfully in WooCommerce',
        woo_id: newWooProduct.id
      }, 200)
    } catch (error) {
      if (logId) {
        await logSyncError(supabaseAdmin, {
          store_id,
          entity_type: 'product',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          stack_trace: error instanceof Error ? error.stack : undefined,
          entity_id: fullProduct.id,
          metadata: { product_name: fullProduct.name }
        }, logId)
      }
      throw error
    }
  } else {
    const logId = await logSyncStart(supabaseAdmin, {
      store_id,
      entity_type: 'product',
      action: 'update_to_woo',
      entity_id: fullProduct.id,
      woo_id: wooId
    })

    try {
      // Update existing product
      const updatedWooProduct = await updateWooCommerceProduct(store, productWithImages)

      // Handle variations if product is variable type
      if (product.type === 'variable') {
        // Fetch our local variations and sync them to WooCommerce
        const { data: variations } = await supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', fullProduct.id)
          .eq('store_id', store_id)

        if (variations && variations.length > 0) {
          console.log(`🔄 Syncing ${variations.length} variations to WooCommerce`)

          for (const variation of variations) {
            if (!variation.woo_id || variation.woo_id === 0) {
              // Create new variation in WooCommerce
              console.log(`➕ Creating new variation in WooCommerce`)
              const newWooVariation = await createWooCommerceVariation(store, wooId, variation)
              await updateVariationWooId(supabase, variation.id, newWooVariation.id)
              console.log(`✅ Created variation with WooCommerce ID: ${newWooVariation.id}`)
            } else {
              // Update existing variation
              console.log(`🔄 Updating existing variation ${variation.woo_id}`)
              await updateWooCommerceVariation(store, wooId, variation)
              console.log(`✅ Updated variation ${variation.woo_id}`)
            }
          }

          console.log(`✅ All variations synced successfully`)
        }
      }

      const duration = Date.now() - startTime
      if (logId) {
        await logSyncSuccess(supabaseAdmin, logId, {
          duration_ms: duration,
          metadata: { 
            product_name: fullProduct.name,
            variations_synced: product.type === 'variable' ? variations?.length || 0 : 0
          }
        })
      }

      return createResponse({ 
        success: true,
        message: 'Product updated successfully in WooCommerce',
        product: updatedWooProduct
      }, 200)
    } catch (error) {
      if (logId) {
        await logSyncError(supabaseAdmin, {
          store_id,
          entity_type: 'product',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          stack_trace: error instanceof Error ? error.stack : undefined,
          entity_id: fullProduct.id,
          woo_id: wooId,
          metadata: { product_name: fullProduct.name }
        }, logId)
      }
      throw error
    }
  }
}
