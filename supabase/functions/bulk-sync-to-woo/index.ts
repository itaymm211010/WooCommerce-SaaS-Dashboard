/**
 * Bulk Sync to WooCommerce Edge Function
 * Last deployment: 2025-11-09
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { withAuth, verifyStoreAccess } from "../shared/auth-middleware.ts"
import { logSyncStart, logSyncSuccess, logSyncError } from "../shared/sync-logger.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { validateRequest, uuidSchema } from "../shared/validation-schemas.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Schema for bulk-sync-to-woo
const bulkSyncSchema = z.object({
  store_id: uuidSchema,
  product_ids: z.array(uuidSchema).optional(),
  force_update: z.boolean().optional(),
})

serve(withAuth(async (req, auth) => {
  try {
    const body = await req.json()

    // Validate request
    const validation = validateRequest(bulkSyncSchema, body)
    if (!validation.success) {
      return new Response(JSON.stringify({
        error: validation.error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { store_id } = validation.data

    // Verify user has access to this store
    const accessCheck = await verifyStoreAccess(auth.userId, store_id)
    if (!accessCheck.success) {
      return new Response(JSON.stringify({
        error: accessCheck.error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    console.log(`Starting bulk sync for store: ${store_id}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const startTime = Date.now()
    const logId = await logSyncStart(supabase, {
      store_id,
      entity_type: 'product',
      action: 'bulk_sync_to_woo'
    })

    // Fetch all products without woo_id for this store
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
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
            product: product
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
          
          // Log individual error
          await logSyncError(supabase, {
            store_id,
            entity_type: 'product',
            error_message: error.message || 'Unknown error',
            entity_id: product.id,
            woo_id: product.woo_id,
            metadata: { product_name: product.name }
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
        
        // Log individual error
        await logSyncError(supabase, {
          store_id,
          entity_type: 'product',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          stack_trace: err instanceof Error ? err.stack : undefined,
          entity_id: product.id,
          woo_id: product.woo_id,
          metadata: { product_name: product.name }
        })
      }
    }

    console.log(`Bulk sync complete: ${syncedCount} synced, ${failedCount} failed`)

    const duration = Date.now() - startTime
    
    if (logId) {
      await logSyncSuccess(supabase, logId, {
        duration_ms: duration,
        metadata: {
          total_products: products.length,
          synced_count: syncedCount,
          failed_count: failedCount
        }
      })
    }

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
}))
