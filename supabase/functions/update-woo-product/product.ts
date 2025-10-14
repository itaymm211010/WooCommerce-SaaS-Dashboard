
import { formatBaseUrl } from "./utils.ts"

// Transform product data for WooCommerce API
export function transformProductForWooCommerce(product: any) {
  const wooProduct: any = {
    name: product.name,
    description: product.description || "",
    short_description: product.short_description || "",
    regular_price: product.price ? product.price.toString() : "0",
    sale_price: product.sale_price ? product.sale_price.toString() : "",
    status: product.status,
    manage_stock: product.stock_quantity !== null,
    stock_quantity: product.stock_quantity !== null ? product.stock_quantity : null,
    sku: product.sku || "",
    weight: product.weight ? product.weight.toString() : "",
    dimensions: {
      length: product.length ? product.length.toString() : "",
      width: product.width ? product.width.toString() : "",
      height: product.height ? product.height.toString() : "",
    },
    categories: product.categories || [],
    tags: product.tags || []
  }
  
  // Add brand as meta data if available
  if (product.brand) {
    wooProduct.meta_data = [
      { key: '_brand', value: product.brand }
    ]
  }

  // Add images if available
  if (product.images && product.images.length > 0) {
    wooProduct.images = product.images.map((img: any, index: number) => ({
      src: img.original_url || img.storage_url,
      alt: img.alt_text || product.name,
      position: index
    }))
  }

  return wooProduct
}

// Create a new product in WooCommerce
export async function createWooCommerceProduct(store: any, product: any) {
  const baseUrl = formatBaseUrl(store.url)
  const wooProduct = transformProductForWooCommerce(product)

  console.log('Creating new product in WooCommerce')
  
  const response = await fetch(
    `${baseUrl}/wp-json/wc/v3/products?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wooProduct)
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return await response.json()
}

// Update an existing product in WooCommerce
export async function updateWooCommerceProduct(store: any, product: any) {
  const baseUrl = formatBaseUrl(store.url)
  const wooProduct = transformProductForWooCommerce(product)
  const wooId = product.woo_id

  console.log(`Updating existing product in WooCommerce with ID: ${wooId}`)
  
  const response = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/${wooId}?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wooProduct)
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return await response.json()
}

// Update variation in WooCommerce
export async function updateWooCommerceVariation(store: any, productWooId: number, variation: any) {
  const baseUrl = formatBaseUrl(store.url)
  
  const wooVariation = {
    sku: variation.sku || "",
    regular_price: variation.regular_price ? variation.regular_price.toString() : "0",
    sale_price: variation.sale_price ? variation.sale_price.toString() : "",
    manage_stock: variation.stock_quantity !== null,
    stock_quantity: variation.stock_quantity !== null ? variation.stock_quantity : null,
    stock_status: variation.stock_status || 'instock',
    attributes: variation.attributes || []
  }

  console.log(`Updating variation ${variation.woo_id} for product ${productWooId}`)
  
  const response = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/${productWooId}/variations/${variation.woo_id}?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wooVariation)
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return await response.json()
}

// Create variation in WooCommerce
export async function createWooCommerceVariation(store: any, productWooId: number, variation: any) {
  const baseUrl = formatBaseUrl(store.url)
  
  const wooVariation = {
    sku: variation.sku || "",
    regular_price: variation.regular_price ? variation.regular_price.toString() : "0",
    sale_price: variation.sale_price ? variation.sale_price.toString() : "",
    manage_stock: variation.stock_quantity !== null,
    stock_quantity: variation.stock_quantity !== null ? variation.stock_quantity : null,
    stock_status: variation.stock_status || 'instock',
    attributes: variation.attributes || []
  }

  console.log(`Creating variation for product ${productWooId}`)
  
  const response = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/${productWooId}/variations?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wooVariation)
    }
  )

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  return await response.json()
}

// Update product in database with new WooCommerce ID
export async function updateProductWooId(supabase: any, productId: string, wooId: number) {
  const { error: updateError } = await supabase
    .from('products')
    .update({ woo_id: wooId })
    .eq('id', productId)
  
  if (updateError) {
    console.error('Error updating product with new WooCommerce ID:', updateError)
    throw updateError
  }
}

// Update variation in database with new WooCommerce ID
export async function updateVariationWooId(supabase: any, variationId: string, wooId: number) {
  const { error: updateError } = await supabase
    .from('product_variations')
    .update({ woo_id: wooId })
    .eq('id', variationId)
  
  if (updateError) {
    console.error('Error updating variation with new WooCommerce ID:', updateError)
    throw updateError
  }
}
