
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

      return new Response(JSON.stringify({ products: productsWithVariations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

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
