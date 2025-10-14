
import { createResponse } from "./utils.ts"
import { getStoreDetails } from "./store.ts"
import { fetchProducts, fetchProductsWithVariations, saveProducts } from "./products.ts"

// Main request handler
export async function handleRequest(req: Request) {
  const { store_id } = await req.json()
  
  if (!store_id) {
    throw new Error('No store_id provided')
  }

  console.log(`Processing sync request for store_id: ${store_id}`)

  // Get store details
  const store = await getStoreDetails(store_id)
  
  try {
    // Fetch products from WooCommerce
    const products = await fetchProducts(store)
    
    // Add variations for variable products
    const productsWithVariations = await fetchProductsWithVariations(products, store)
    
    // Save products to the database
    await saveProducts(productsWithVariations, store_id)
    
    return createResponse({ 
      success: true,
      message: 'Products and images synced successfully',
      count: products.length
    }, 200)
    
  } catch (fetchError) {
    console.error('Error fetching products from WooCommerce:', fetchError)
    
    return createResponse({ 
      error: fetchError instanceof Error ? fetchError.message : 'Unknown error fetching products'
    }, 500)
  }
}
