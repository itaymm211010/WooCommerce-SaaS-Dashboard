
import { createSupabaseClient, formatBaseUrl } from "./utils.ts"
import { checkAndUpdateCurrency } from "./store.ts"
import { fetchAllPaged } from "../shared/woocommerce-utils.ts"

// Fetch products from WooCommerce API with pagination
export async function fetchProducts(store: any) {
  const baseUrl = formatBaseUrl(store.url)

  console.log(`Fetching products from ${baseUrl}/wp-json/wc/v3/products`)

  // First check and update currency if needed
  await checkAndUpdateCurrency(store, baseUrl)

  // Use the reusable pagination utility
  const allProducts = await fetchAllPaged({
    baseUrl,
    endpoint: '/wp-json/wc/v3/products',
    auth: {
      consumer_key: store.api_key,
      consumer_secret: store.api_secret
    },
    perPage: 100
  })

  console.log(`✅ Fetched total of ${allProducts.length} products from WooCommerce`)

  return allProducts
}

// Fetch variations for variable products with pagination
export async function fetchProductsWithVariations(products: any[], store: any) {
  const baseUrl = formatBaseUrl(store.url)

  return Promise.all(products.map(async (product) => {
    if (product.type === 'variable') {
      try {
        // Use the reusable pagination utility for variations
        const allVariations = await fetchAllPaged({
          baseUrl,
          endpoint: `/wp-json/wc/v3/products/${product.id}/variations`,
          auth: {
            consumer_key: store.api_key,
            consumer_secret: store.api_secret
          },
          perPage: 100
        })

        console.log(`Fetched ${allVariations.length} variations for product ${product.id}`)
        return { ...product, variations: allVariations }
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
  
  let productsUpdated = 0
  let productsCreated = 0
  
  // UPSERT products - update if exists, insert if new
  for (const product of productsWithVariations) {
    // Check if product exists by woo_id
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('woo_id', product.id)
      .maybeSingle()
    
    const productData = {
      store_id: storeId,
      woo_id: product.id,
      name: product.name,
      description: product.description || '',
      short_description: product.short_description || '',
      sku: product.sku || '',
      price: parseFloat(product.regular_price || '0'),
      sale_price: product.sale_price ? parseFloat(product.sale_price) : null,
      stock_quantity: product.stock_quantity,
      status: product.status,
      type: product.type || 'simple',
      weight: product.weight ? parseFloat(product.weight) : null,
      length: product.dimensions?.length ? parseFloat(product.dimensions.length) : null,
      width: product.dimensions?.width ? parseFloat(product.dimensions.width) : null,
      height: product.dimensions?.height ? parseFloat(product.dimensions.height) : null,
      categories: product.categories || [],
      tags: product.tags || [],
      brands: product.brands ? product.brands.map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: b.slug
      })) : [],
      source: 'woo' as const,
      synced_at: new Date().toISOString()
    }
    
    let insertedProduct: any
    
    if (existingProduct) {
      // Update existing product
      const { data, error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existingProduct.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating product:', updateError)
        continue
      }
      insertedProduct = data
      productsUpdated++
    } else {
      // Insert new product
      const { data, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()
      
      if (insertError) {
        console.error('Error inserting product:', insertError)
        continue
      }
      insertedProduct = data
      productsCreated++
    }

    // Upsert product images (idempotent - won't create duplicates)
    if (product.images && product.images.length > 0) {
      const imagesToUpsert = product.images.map((image: any, index: number) => ({
        store_id: storeId,
        product_id: insertedProduct.id,
        original_url: image.src,
        woo_media_id: image.id || null,  // save WooCommerce media attachment ID
        storage_url: null,
        storage_source: 'woocommerce',
        type: index === 0 ? 'featured' : 'gallery',
        alt_text: image.alt || '',
        description: '',
        display_order: index,
        source: 'woo' as const,
        synced_at: new Date().toISOString()
      }))

      const { data: upsertedImages, error: imageError } = await supabase
        .from('product_images')
        .upsert(imagesToUpsert, {
          onConflict: 'product_id,original_url',
          ignoreDuplicates: false
        })
        .select()

      if (imageError) {
        console.error('Error upserting product images:', imageError)
        continue
      }

      // Update product with featured image if available
      if (upsertedImages && upsertedImages[0]) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ featured_image_id: upsertedImages[0].id })
          .eq('id', insertedProduct.id)

        if (updateError) {
          console.error('Error updating product featured image:', updateError)
        }
      }
    }

    // Save variations for variable products
    if (product.type === 'variable' && product.variations && product.variations.length > 0) {
      console.log(`Saving ${product.variations.length} variations for product ${product.name}`)
      
      for (const variation of product.variations) {
        // Check if variation exists by woo_id
        const { data: existingVariation } = await supabase
          .from('product_variations')
          .select('id')
          .eq('store_id', storeId)
          .eq('woo_id', variation.id)
          .maybeSingle()
        
        const variationData = {
          store_id: storeId,
          product_id: insertedProduct.id,
          woo_id: variation.id,
          sku: variation.sku || '',
          price: parseFloat(variation.price || '0'),
          regular_price: parseFloat(variation.regular_price || '0'),
          sale_price: variation.sale_price ? parseFloat(variation.sale_price) : null,
          stock_quantity: variation.stock_quantity,
          stock_status: variation.stock_status || 'instock',
          attributes: variation.attributes || [],
          source: 'woo' as const,
          synced_at: new Date().toISOString()
        }
        
        let insertedVariation: any
        
        if (existingVariation) {
          // Update existing variation
          const { data, error: updateError } = await supabase
            .from('product_variations')
            .update(variationData)
            .eq('id', existingVariation.id)
            .select()
            .single()
          
          if (updateError) {
            console.error('Error updating variation:', updateError)
            continue
          }
          insertedVariation = data
        } else {
          // Insert new variation
          const { data, error: insertError } = await supabase
            .from('product_variations')
            .insert(variationData)
            .select()
            .single()

          if (insertError) {
            console.error('Error inserting variation:', insertError)
            continue
          }
          insertedVariation = data
        }

        // Upsert variation image if exists
        if (variation.image && variation.image.src) {
          const { data: variationImage, error: variationImageError } = await supabase
            .from('product_images')
            .upsert({
              store_id: storeId,
              product_id: insertedProduct.id,
              original_url: variation.image.src,
              woo_media_id: variation.image.id || null,  // save WooCommerce media attachment ID
              storage_url: null,
              storage_source: 'woocommerce',
              type: 'variation',
              alt_text: variation.image.alt || '',
              description: '',
              display_order: 0,
              source: 'woo' as const,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'product_id,original_url',
              ignoreDuplicates: false
            })
            .select()
            .single()

          if (!variationImageError && variationImage) {
            // Link image to variation
            await supabase
              .from('product_variations')
              .update({ image_id: variationImage.id })
              .eq('id', insertedVariation.id)
          }
        }
      }
    }
  }
  
  console.log(`✅ Sync complete: ${productsCreated} products created, ${productsUpdated} products updated`)
}
