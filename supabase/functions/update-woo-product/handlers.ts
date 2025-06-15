
import { createResponse, createSupabaseClient } from "./utils.ts"
import { getStoreDetails } from "./store.ts"
import { createWooCommerceProduct, updateWooCommerceProduct, updateProductWooId } from "./product.ts"

// Main request handler
export async function handleRequest(req: Request) {
  const { product, store_id } = await req.json()
  
  if (!store_id || !product) {
    throw new Error('Missing required parameters: store_id or product')
  }

  console.log(`Processing product update for store_id: ${store_id}, product: ${product.id}`)

  // Get store details
  const store = await getStoreDetails(store_id)
  const supabase = createSupabaseClient()
  const wooId = product.woo_id

  // If no WooCommerce ID, create new product
  if (!wooId || wooId === 0) {
    const newWooProduct = await createWooCommerceProduct(store, product)
    
    // Update the product in our database with the new WooCommerce ID
    await updateProductWooId(supabase, product.id, newWooProduct.id)

    return createResponse({ 
      success: true,
      message: 'Product created successfully in WooCommerce',
      woo_id: newWooProduct.id
    }, 200)
  } else {
    // Update existing product
    const updatedWooProduct = await updateWooCommerceProduct(store, product)

    return createResponse({ 
      success: true,
      message: 'Product updated successfully in WooCommerce',
      product: updatedWooProduct
    }, 200)
  }
}
