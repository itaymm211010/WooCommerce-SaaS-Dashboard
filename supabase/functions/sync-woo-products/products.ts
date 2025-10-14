
import { createSupabaseClient, formatBaseUrl } from "./utils.ts"
import { checkAndUpdateCurrency } from "./store.ts"

// Fetch products from WooCommerce API
export async function fetchProducts(store: any) {
  const baseUrl = formatBaseUrl(store.url)
  
  console.log(`Fetching products from ${baseUrl}/wp-json/wc/v3/products`)
  
  // First check and update currency if needed
  await checkAndUpdateCurrency(store, baseUrl)
  
  // Make request to WooCommerce API
  const wooResponse = await fetch(
    `${baseUrl}/wp-json/wc/v3/products?per_page=100&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
    {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
  )

  if (!wooResponse.ok) {
    const errorText = await wooResponse.text()
    throw new Error(`WooCommerce API Error: ${wooResponse.status} ${wooResponse.statusText} - ${errorText}`)
  }

  const products = await wooResponse.json()
  console.log(`Fetched ${products.length} products from WooCommerce`)
  
  return products
}

// Fetch variations for variable products
export async function fetchProductsWithVariations(products: any[], store: any) {
  const baseUrl = formatBaseUrl(store.url)
  
  return Promise.all(products.map(async (product) => {
    if (product.type === 'variable') {
      try {
        const variationsResponse = await fetch(
          `${baseUrl}/wp-json/wc/v3/products/${product.id}/variations?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (variationsResponse.ok) {
          const variations = await variationsResponse.json()
          return { ...product, variations }
        }
      } catch (error) {
        console.error(`Failed to fetch variations for product ${product.id}:`, error)
      }
    }
    return product
  }))
}

// Save products and their images to the database
export async function saveProducts(productsWithVariations: any[], storeId: string) {
  const supabase = createSupabaseClient()
  
  console.log('Saving products and images to database...')
  
  // First, delete existing products for this store to avoid duplicates
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('store_id', storeId)
  
  if (deleteError) {
    console.error('Error deleting existing products:', deleteError)
    throw deleteError
  }
  
  // Insert new products and their images
  for (const product of productsWithVariations) {
    // Insert the product first
    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        store_id: storeId,
        woo_id: product.id,
        name: product.name,
        description: product.description || '',
        short_description: product.short_description || '',
        sku: product.sku || '',
        price: parseFloat(product.price || '0'),
        sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
        stock_quantity: product.stock_quantity,
        status: product.status,
        type: product.type || 'simple',
        weight: product.weight ? parseFloat(product.weight) : null,
        length: product.dimensions?.length ? parseFloat(product.dimensions.length) : null,
        width: product.dimensions?.width ? parseFloat(product.dimensions.width) : null,
        height: product.dimensions?.height ? parseFloat(product.dimensions.height) : null,
        categories: product.categories || []
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error inserting product:', insertError)
      continue
    }

    // Insert product images
    if (product.images && product.images.length > 0) {
      const imagesToInsert = product.images.map((image: any, index: number) => ({
        store_id: storeId,
        product_id: insertedProduct.id,
        original_url: image.src,
        storage_url: null,
        storage_source: 'woocommerce',
        type: index === 0 ? 'featured' : 'gallery',
        alt_text: image.alt || '',
        description: '',
        display_order: index
      }))

      const { data: insertedImages, error: imageError } = await supabase
        .from('product_images')
        .insert(imagesToInsert)
        .select()

      if (imageError) {
        console.error('Error inserting product images:', imageError)
        continue
      }

      // Update product with featured image if available
      if (insertedImages && insertedImages[0]) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ featured_image_id: insertedImages[0].id })
          .eq('id', insertedProduct.id)

        if (updateError) {
          console.error('Error updating product featured image:', updateError)
        }
      }
    }
  }
}
