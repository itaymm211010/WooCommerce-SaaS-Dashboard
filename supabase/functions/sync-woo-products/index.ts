import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { store_id } = await req.json()
    
    if (!store_id) {
      throw new Error('No store_id provided')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Processing sync request for store_id: ${store_id}`)

    // Get store details
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', store_id)
      .single()

    if (storeError || !store) {
      return new Response(JSON.stringify({ 
        error: `Store not found: ${storeError?.message || 'Unknown error'}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    if (!store.url || !store.api_key || !store.api_secret) {
      return new Response(JSON.stringify({ 
        error: 'Missing store configuration'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Format the base URL
    let baseUrl = store.url.replace(/\/+$/, '')
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`
    }

    console.log(`Fetching products from ${baseUrl}/wp-json/wc/v3/products`)

    // First, check and update currency if it changed in WooCommerce
    try {
      const currencyResponse = await fetch(
        `${baseUrl}/wp-json/wc/v3/settings/general?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (currencyResponse.ok) {
        const settings = await currencyResponse.json();
        const currencySetting = settings.find((setting: any) => setting.id === 'woocommerce_currency');
        
        if (currencySetting && currencySetting.value !== store.currency) {
          console.log(`Currency changed from ${store.currency} to ${currencySetting.value}, updating...`);
          await supabase
            .from('stores')
            .update({ currency: currencySetting.value })
            .eq('id', store_id);
        }
      }
    } catch (error) {
      console.error('Error checking store currency:', error);
      // Continue with product sync even if currency check fails
    }

    // Make request to WooCommerce API from the server
    try {
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
        return new Response(JSON.stringify({
          error: `WooCommerce API Error: ${wooResponse.status} ${wooResponse.statusText} - ${errorText}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: wooResponse.status
        });
      }

      const products = await wooResponse.json()
      console.log(`Fetched ${products.length} products from WooCommerce`)

      // Fetch variations for variable products
      const productsWithVariations = await Promise.all(products.map(async (product) => {
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

      // Save products to the database
      console.log('Saving products and images to database...')
      
      // First, delete existing products for this store to avoid duplicates
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('store_id', store_id)
      
      if (deleteError) {
        console.error('Error deleting existing products:', deleteError)
        throw deleteError;
      }
      
      // Insert new products and their images
      for (const product of productsWithVariations) {
        // Insert the product first
        const { data: insertedProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            store_id: store_id,
            woo_id: product.id,
            name: product.name,
            price: parseFloat(product.price || '0'),
            stock_quantity: product.stock_quantity,
            status: product.status,
            type: product.type || 'simple'
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error inserting product:', insertError);
          continue;
        }

        // Insert product images
        if (product.images && product.images.length > 0) {
          const imagesToInsert = product.images.map((image: any, index: number) => ({
            store_id: store_id,
            product_id: insertedProduct.id,
            original_url: image.src,
            storage_url: null,
            storage_source: 'woocommerce',
            type: index === 0 ? 'featured' : 'gallery',
            alt_text: image.alt || '',
            description: '',
            display_order: index
          }));

          const { data: insertedImages, error: imageError } = await supabase
            .from('product_images')
            .insert(imagesToInsert)
            .select();

          if (imageError) {
            console.error('Error inserting product images:', imageError);
            continue;
          }

          // Update product with featured image if available
          if (insertedImages && insertedImages[0]) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ featured_image_id: insertedImages[0].id })
              .eq('id', insertedProduct.id);

            if (updateError) {
              console.error('Error updating product featured image:', updateError);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Products and images synced successfully'
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (fetchError) {
      console.error('Error fetching products from WooCommerce:', fetchError);
      
      return new Response(JSON.stringify({ 
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error fetching products'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } catch (error) {
    console.error('Error in sync-woo-products function:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
