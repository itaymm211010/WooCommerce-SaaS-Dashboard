
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
  
  // Fetch product images
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .eq('store_id', store_id)
    .order('display_order', { ascending: true })

  // Add images to product object
  const productWithImages = {
    ...product,
    images: images || []
  }

  const wooId = product.woo_id

  // If no WooCommerce ID, create new product
  if (!wooId || wooId === 0) {
    const newWooProduct = await createWooCommerceProduct(store, productWithImages)
    
    // Update the product in our database with the new WooCommerce ID
    await updateProductWooId(supabase, product.id, newWooProduct.id)

    return createResponse({ 
      success: true,
      message: 'Product created successfully in WooCommerce',
      woo_id: newWooProduct.id
    }, 200)
  } else {
    // Update existing product
    const updatedWooProduct = await updateWooCommerceProduct(store, productWithImages)

    return createResponse({ 
      success: true,
      message: 'Product updated successfully in WooCommerce',
      product: updatedWooProduct
    }, 200)
  }
}
