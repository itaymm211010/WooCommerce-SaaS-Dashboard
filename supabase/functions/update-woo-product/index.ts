
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
    const { product, store_id } = await req.json()
    
    if (!store_id || !product) {
      throw new Error('Missing required parameters: store_id or product')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Processing product update for store_id: ${store_id}, product: ${product.id}`)

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
      })
    }

    if (!store.url || !store.api_key || !store.api_secret) {
      return new Response(JSON.stringify({ 
        error: 'Missing store configuration'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    // Format the base URL
    let baseUrl = store.url.replace(/\/+$/, '')
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`
    }

    const wooId = product.woo_id

    // If no WooCommerce ID, create new product
    if (!wooId || wooId === 0) {
      console.log('Creating new product in WooCommerce')
      
      const wooProduct = {
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
        }
      }

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
        return new Response(JSON.stringify({
          error: `WooCommerce API Error: ${response.status} ${response.statusText} - ${errorData}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status
        })
      }

      const newWooProduct = await response.json()
      
      // Update the product in our database with the new WooCommerce ID
      const { error: updateError } = await supabase
        .from('products')
        .update({ woo_id: newWooProduct.id })
        .eq('id', product.id)
      
      if (updateError) {
        console.error('Error updating product with new WooCommerce ID:', updateError)
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Product created successfully in WooCommerce',
        woo_id: newWooProduct.id
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    } else {
      // Update existing product
      console.log(`Updating existing product in WooCommerce with ID: ${wooId}`)
      
      const wooProduct = {
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
        }
      }

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
        return new Response(JSON.stringify({
          error: `WooCommerce API Error: ${response.status} ${response.statusText} - ${errorData}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status
        })
      }

      const updatedWooProduct = await response.json()

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Product updated successfully in WooCommerce',
        product: updatedWooProduct
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

  } catch (error) {
    console.error('Error in update-woo-product function:', error)
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
