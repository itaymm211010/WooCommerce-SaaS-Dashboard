
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
    const { store_id } = await req.clone().json()
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
      throw new Error(`Store not found: ${storeError?.message}`)
    }

    const rawBody = await req.text()
    console.log('Received webhook payload:', rawBody)
    const body = JSON.parse(rawBody)

    // בדיקה האם זה וובהוק של מוצר חדש או מעודכן
    if (body.topic === 'product.created' || body.topic === 'product.updated') {
      console.log(`Processing ${body.topic} webhook`)

      // השג את פרטי המוצר מווקומרס
      let baseUrl = store.url.replace(/\/+$/, '')
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`
      }

      const productResponse = await fetch(
        `${baseUrl}/wp-json/wc/v3/products/${body.resource_id}?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      )

      if (!productResponse.ok) {
        throw new Error(`Failed to fetch product details: ${productResponse.statusText}`)
      }

      const product = await productResponse.json()
      console.log('Fetched product details:', product)

      // בדוק אם המוצר כבר קיים
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', store_id)
        .eq('woo_id', product.id)
        .single()

      if (existingProduct) {
        // עדכן מוצר קיים
        console.log('Updating existing product')
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: product.name,
            price: product.regular_price || product.price,
            stock_quantity: product.stock_quantity,
            status: product.status,
            type: product.type,
            description: product.description,
            short_description: product.short_description,
            sku: product.sku,
            manage_stock: product.manage_stock,
            stock_status: product.stock_status,
            updated_at: new Date().toISOString()
          })
          .eq('store_id', store_id)
          .eq('woo_id', product.id)

        if (updateError) {
          throw new Error(`Failed to update product: ${updateError.message}`)
        }
        console.log('Successfully updated product')

        // Sync attributes for variable products
        if (product.type === 'variable' && product.attributes && Array.isArray(product.attributes)) {
          console.log(`Syncing ${product.attributes.length} attributes from WooCommerce`)

          for (const wooAttr of product.attributes) {
            // Check if attribute already exists
            const { data: existingAttr } = await supabase
              .from('product_attributes')
              .select('id')
              .eq('product_id', existingProduct.id)
              .eq('name', wooAttr.name)
              .maybeSingle()

            if (existingAttr) {
              // Update existing attribute
              await supabase
                .from('product_attributes')
                .update({
                  options: wooAttr.options || [],
                  visible: wooAttr.visible !== false,
                  variation: wooAttr.variation !== false,
                  position: wooAttr.position || 0,
                  woo_id: wooAttr.id || 0
                })
                .eq('id', existingAttr.id)
            } else {
              // Insert new attribute
              await supabase
                .from('product_attributes')
                .insert({
                  store_id: store_id,
                  product_id: existingProduct.id,
                  name: wooAttr.name,
                  options: wooAttr.options || [],
                  visible: wooAttr.visible !== false,
                  variation: wooAttr.variation !== false,
                  position: wooAttr.position || 0,
                  woo_id: wooAttr.id || 0
                })
            }
          }
          console.log('Successfully synced attributes from WooCommerce')
        }
      } else {
        // הכנס מוצר חדש
        console.log('Inserting new product')
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert({
            store_id: store_id,
            woo_id: product.id,
            name: product.name,
            price: product.regular_price || product.price,
            stock_quantity: product.stock_quantity,
            status: product.status,
            type: product.type,
            description: product.description,
            short_description: product.short_description,
            sku: product.sku,
            manage_stock: product.manage_stock,
            stock_status: product.stock_status
          })
          .select()
          .single()

        if (insertError) {
          throw new Error(`Failed to insert product: ${insertError.message}`)
        }
        console.log('Successfully inserted new product')

        // Sync attributes for variable products
        if (product.type === 'variable' && product.attributes && Array.isArray(product.attributes) && newProduct) {
          console.log(`Syncing ${product.attributes.length} attributes from WooCommerce for new product`)

          for (const wooAttr of product.attributes) {
            await supabase
              .from('product_attributes')
              .insert({
                store_id: store_id,
                product_id: newProduct.id,
                name: wooAttr.name,
                options: wooAttr.options || [],
                visible: wooAttr.visible !== false,
                variation: wooAttr.variation !== false,
                position: wooAttr.position || 0,
                woo_id: wooAttr.id || 0
              })
          }
          console.log('Successfully synced attributes from WooCommerce for new product')
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // טיפול בעדכוני סטטוס הזמנה
    if (body.topic === 'order.updated') {
      console.log('Processing order status webhook')
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', store_id)
        .eq('woo_id', body.resource_id)
        .single()

      if (orderError) {
        throw new Error(`Order not found: ${orderError.message}`)
      }

      // עדכן את סטטוס ההזמנה
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: body.status })
        .eq('store_id', store_id)
        .eq('woo_id', body.resource_id)

      if (updateError) {
        throw new Error(`Failed to update order: ${updateError.message}`)
      }

      console.log('Successfully updated order status')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
