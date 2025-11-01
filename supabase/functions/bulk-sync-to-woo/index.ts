import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

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

    console.log(`Starting bulk sync for store: ${store_id}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all products without woo_id for this store
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, sku')
      .eq('store_id', store_id)
      .is('woo_id', null)

    if (fetchError) {
      console.error('Error fetching products:', fetchError)
      throw fetchError
    }

    if (!products || products.length === 0) {
      console.log('No products to sync')
      return new Response(JSON.stringify({ 
        success: true,
        message: 'No products to sync',
        synced: 0,
        failed: 0,
        total: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`Found ${products.length} products to sync`)

    let syncedCount = 0
    let failedCount = 0
    const errors: any[] = []

    // Sync each product
    for (const product of products) {
      try {
        console.log(`Syncing product: ${product.name} (${product.id})`)
        
        const { data, error } = await supabase.functions.invoke('update-woo-product', {
          body: {
            store_id: store_id,
            product: { id: product.id }
          }
        })

        if (error) {
          console.error(`Failed to sync product ${product.name}:`, error)
          failedCount++
          errors.push({
            product_id: product.id,
            product_name: product.name,
            error: error.message || 'Unknown error'
          })
        } else {
          console.log(`Successfully synced product ${product.name}`)
          syncedCount++
        }
      } catch (err) {
        console.error(`Error syncing product ${product.name}:`, err)
        failedCount++
        errors.push({
          product_id: product.id,
          product_name: product.name,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    console.log(`Bulk sync complete: ${syncedCount} synced, ${failedCount} failed`)

    return new Response(JSON.stringify({ 
      success: true,
      message: `Synced ${syncedCount} of ${products.length} products`,
      synced: syncedCount,
      failed: failedCount,
      total: products.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('Error in bulk-sync-to-woo function:', error)
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
