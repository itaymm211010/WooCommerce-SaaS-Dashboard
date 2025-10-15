
import { createResponse, createSupabaseClient } from "./utils.ts"
import { getStoreDetails } from "./store.ts"
import { 
  createWooCommerceProduct, 
  updateWooCommerceProduct, 
  updateProductWooId,
  createWooCommerceVariation,
  updateWooCommerceVariation,
  updateVariationWooId
} from "./product.ts"

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

  // Fetch product attributes (for variable products)
  const { data: attributes } = await supabase
    .from('product_attributes')
    .select('*')
    .eq('product_id', product.id)
    .eq('store_id', store_id)
    .order('position', { ascending: true })

  // Add images and attributes to product object
  const productWithImages = {
    ...product,
    images: images || [],
    attributes: attributes || []
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

    // Handle variations if product is variable type
    if (product.type === 'variable') {
      const { data: variations } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', product.id)
        .eq('store_id', store_id)

      if (variations && variations.length > 0) {
        console.log(`Syncing ${variations.length} variations to WooCommerce`)
        
        for (const variation of variations) {
          if (!variation.woo_id || variation.woo_id === 0) {
            // Create new variation in WooCommerce
            const newWooVariation = await createWooCommerceVariation(store, wooId, variation)
            await updateVariationWooId(supabase, variation.id, newWooVariation.id)
          } else {
            // Update existing variation
            await updateWooCommerceVariation(store, wooId, variation)
          }
        }
      }
    }

    return createResponse({ 
      success: true,
      message: 'Product updated successfully in WooCommerce',
      product: updatedWooProduct
    }, 200)
  }
}
