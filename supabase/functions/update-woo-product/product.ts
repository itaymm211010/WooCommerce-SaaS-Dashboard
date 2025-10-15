
import { formatBaseUrl } from "./utils.ts"

// Fetch existing variations from WooCommerce
export async function fetchWooCommerceVariations(store: any, productWooId: number) {
  const baseUrl = formatBaseUrl(store.url)
  
  try {
    const response = await fetch(
      `${baseUrl}/wp-json/wc/v3/products/${productWooId}/variations?per_page=100&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      console.error(`Failed to fetch variations for product ${productWooId}:`, await response.text())
      return []
    }
    
    const variations = await response.json()
    console.log(`Fetched ${variations.length} variations from WooCommerce for product ${productWooId}`)
    return variations
  } catch (error) {
    console.error(`Error fetching WooCommerce variations:`, error)
    return []
  }
}

// Sync WooCommerce variations to our database
export async function syncVariationsFromWooCommerce(
  supabase: any, 
  storeId: string, 
  productId: string, 
  productWooId: number, 
  store: any
) {
  console.log(`🔄 Syncing variations from WooCommerce for product ${productWooId}...`)
  
  const wooVariations = await fetchWooCommerceVariations(store, productWooId)
  
  if (wooVariations.length === 0) {
    console.log('No variations found in WooCommerce')
    return
  }
  
  let variationsSynced = 0
  
  for (const wooVar of wooVariations) {
    // Check if variation exists in our DB by woo_id
    const { data: existingByWooId } = await supabase
      .from('product_variations')
      .select('id')
      .eq('woo_id', wooVar.id)
      .eq('product_id', productId)
      .maybeSingle()
    
    if (existingByWooId) {
      console.log(`✓ Variation ${wooVar.id} already exists in DB`)
      continue
    }
    
    // Check if variation exists by SKU (in case woo_id was lost)
    if (wooVar.sku) {
      const { data: existingBySku } = await supabase
        .from('product_variations')
        .select('id, woo_id')
        .eq('sku', wooVar.sku)
        .eq('product_id', productId)
        .maybeSingle()
      
      if (existingBySku) {
        // Update existing variation with woo_id
        console.log(`✓ Found variation by SKU (${wooVar.sku}), updating woo_id to ${wooVar.id}`)
        await supabase
          .from('product_variations')
          .update({ woo_id: wooVar.id })
          .eq('id', existingBySku.id)
        variationsSynced++
        continue
      }
    }
    
    // Insert missing variation
    console.log(`➕ Inserting missing variation from WooCommerce: ${wooVar.id}`)
    const { error: insertError } = await supabase
      .from('product_variations')
      .insert({
        store_id: storeId,
        product_id: productId,
        woo_id: wooVar.id,
        sku: wooVar.sku || '',
        price: parseFloat(wooVar.price || '0'),
        regular_price: parseFloat(wooVar.regular_price || '0'),
        sale_price: wooVar.sale_price ? parseFloat(wooVar.sale_price) : null,
        stock_quantity: wooVar.stock_quantity,
        stock_status: wooVar.stock_status || 'instock',
        attributes: wooVar.attributes || []
      })
    
    if (insertError) {
      console.error('Error inserting variation from WooCommerce:', insertError)
    } else {
      variationsSynced++
    }
  }
  
  console.log(`✅ Synced ${variationsSynced} variations from WooCommerce`)
}

// Create a new category in WooCommerce
async function createCategory(store: any, categoryName: string) {
  const baseUrl = formatBaseUrl(store.url);
  console.log(`Creating new category: ${categoryName}`);
  
  // First, try to find existing category
  const searchResponse = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/categories?search=${encodeURIComponent(categoryName)}&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`
  );
  
  if (searchResponse.ok) {
    const existingCategories = await searchResponse.json();
    const exactMatch = existingCategories.find((cat: any) => cat.name.toLowerCase() === categoryName.toLowerCase());
    if (exactMatch) {
      console.log(`Found existing category with ID: ${exactMatch.id}`);
      return exactMatch;
    }
  }
  
  // If not found, create new
  const response = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/categories?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to create category:', errorData);
    return null;
  }
  
  const newCategory = await response.json();
  console.log(`Category created with ID: ${newCategory.id}`);
  return newCategory;
}

// Create a new tag in WooCommerce
async function createTag(store: any, tagName: string) {
  const baseUrl = formatBaseUrl(store.url);
  console.log(`Creating new tag: ${tagName}`);
  
  // First, try to find existing tag
  const searchResponse = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/tags?search=${encodeURIComponent(tagName)}&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`
  );
  
  if (searchResponse.ok) {
    const existingTags = await searchResponse.json();
    const exactMatch = existingTags.find((tag: any) => tag.name.toLowerCase() === tagName.toLowerCase());
    if (exactMatch) {
      console.log(`Found existing tag with ID: ${exactMatch.id}`);
      return exactMatch;
    }
  }
  
  // If not found, create new
  const response = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/tags?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tagName })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to create tag:', errorData);
    return null;
  }
  
  const newTag = await response.json();
  console.log(`Tag created with ID: ${newTag.id}`);
  return newTag;
}

// Create a new brand in WooCommerce
async function createBrand(store: any, brandName: string) {
  const baseUrl = formatBaseUrl(store.url);
  console.log(`Creating new brand: ${brandName}`);
  
  // First, try to find existing brand
  const searchResponse = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/brands?search=${encodeURIComponent(brandName)}&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`
  );
  
  if (searchResponse.ok) {
    const existingBrands = await searchResponse.json();
    if (existingBrands.length > 0) {
      console.log(`Found existing brand with ID: ${existingBrands[0].id}`);
      return existingBrands[0];
    }
  }
  
  // If not found, create new
  const response = await fetch(
    `${baseUrl}/wp-json/wc/v3/products/brands?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: brandName })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to create brand:', errorData);
    return null;
  }
  
  const newBrand = await response.json();
  console.log(`Brand created with ID: ${newBrand.id}`);
  return newBrand;
}

// Process items (categories/tags) - create new ones and return all with IDs
async function processItems(store: any, items: any[], type: 'category' | 'tag') {
  if (!items) return [];
  
  const processedItems = [];
  
  for (const item of items) {
    if (item.id > 1000000000000) {
      // New item - create it in WooCommerce
      console.log(`New ${type} detected: ${item.name} (ID: ${item.id})`);
      const created = type === 'category' 
        ? await createCategory(store, item.name)
        : await createTag(store, item.name);
      
      if (created) {
        processedItems.push({ id: created.id });
      }
    } else {
      // Existing item - just use the ID
      processedItems.push({ id: item.id });
    }
  }
  
  return processedItems;
}

// Process brands - create new ones and return all with IDs
async function processBrands(store: any, brands: any[]) {
  if (!brands || brands.length === 0) return [];
  
  const processedBrands = [];
  
  for (const brand of brands) {
    if (brand.id > 1000000000000) {
      // New brand - create it in WooCommerce
      console.log(`New brand detected: ${brand.name} (ID: ${brand.id})`);
      const created = await createBrand(store, brand.name);
      
      if (created) {
        processedBrands.push({ id: created.id });
      }
    } else {
      // Existing brand - just use the ID
      processedBrands.push({ id: brand.id });
    }
  }
  
  return processedBrands;
}

// Transform product data for WooCommerce API
export async function transformProductForWooCommerce(product: any, store: any) {
  // Process categories, tags, and brands - create new ones first
  const categories = await processItems(store, product.categories, 'category');
  const tags = await processItems(store, product.tags, 'tag');
  const brands = await processBrands(store, product.brands);
  
  const wooProduct: any = {
    name: product.name,
    type: product.type,
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
    categories,
    tags
  }
  
  console.log('Final categories:', JSON.stringify(wooProduct.categories));
  console.log('Final tags:', JSON.stringify(wooProduct.tags));
  
  // Add brands as taxonomy with IDs
  if (brands.length > 0) {
    wooProduct.brands = brands;
    console.log('Adding brands:', JSON.stringify(brands));
  }

  // Add attributes if available (for variable products)
  if (product.attributes && Array.isArray(product.attributes)) {
    wooProduct.attributes = product.attributes.map((attr: any) => ({
      id: attr.woo_id || 0,
      name: attr.name,
      options: attr.options || [],
      visible: attr.visible !== false,
      variation: attr.variation !== false,
      position: attr.position || 0
    }));
    console.log('Adding attributes:', JSON.stringify(wooProduct.attributes));
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
  const wooProduct = await transformProductForWooCommerce(product, store)

  console.log('Creating new product in WooCommerce:', JSON.stringify(wooProduct, null, 2))
  
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
    console.error('WooCommerce API Error:', errorData)
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  const result = await response.json()
  console.log('WooCommerce response:', JSON.stringify(result, null, 2))
  return result
}

// Update an existing product in WooCommerce
export async function updateWooCommerceProduct(store: any, product: any) {
  const baseUrl = formatBaseUrl(store.url)
  const wooProduct = await transformProductForWooCommerce(product, store)
  const wooId = product.woo_id

  console.log(`Updating existing product in WooCommerce with ID: ${wooId}`)
  console.log('Product data:', JSON.stringify(wooProduct, null, 2))
  
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
    console.error('WooCommerce API Error:', errorData)
    throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorData}`)
  }

  const result = await response.json()
  console.log('WooCommerce response:', JSON.stringify(result, null, 2))
  return result
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
