import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, createResponse, createSupabaseClient } from "./utils.ts"
import { getStoreDetails } from "./store.ts"
import { syncCategories } from "./sync-categories.ts"
import { syncTags } from "./sync-tags.ts"
import { syncBrands } from "./sync-brands.ts"
import { withAuth, verifyStoreAccess } from "../shared/auth-middleware.ts"
import { logSyncStart, logSyncSuccess, logSyncError } from "../shared/sync-logger.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { validateRequest, uuidSchema } from "../shared/validation-schemas.ts"

// Schema for sync-taxonomies (uses storeId not store_id)
const syncTaxonomiesSchema = z.object({
  storeId: uuidSchema,
  taxonomy_type: z.enum(['categories', 'tags', 'brands']).optional(),
  force_sync: z.boolean().optional(),
})

serve(withAuth(async (req, auth) => {
  try {
    const body = await req.json()

    // Validate request
    const validation = validateRequest(syncTaxonomiesSchema, body)
    if (!validation.success) {
      return new Response(JSON.stringify({
        error: validation.error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { storeId } = validation.data

    // Verify user has access to this store
    const accessCheck = await verifyStoreAccess(auth.userId, storeId)
    if (!accessCheck.success) {
      return new Response(JSON.stringify({
        error: accessCheck.error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    console.log(`🚀 Starting taxonomy sync for store: ${storeId}`)
    const startTime = Date.now()

    // Create service role client for logging
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Log start for each taxonomy type
    const categoryLogId = await logSyncStart(supabaseAdmin, {
      store_id: storeId,
      entity_type: 'category',
      action: 'sync_from_woo'
    })
    const tagLogId = await logSyncStart(supabaseAdmin, {
      store_id: storeId,
      entity_type: 'tag',
      action: 'sync_from_woo'
    })
    const brandLogId = await logSyncStart(supabaseAdmin, {
      store_id: storeId,
      entity_type: 'brand',
      action: 'sync_from_woo'
    })

    // Get store details
    const store = await getStoreDetails(storeId)
    
    // Parallel sync with Promise.allSettled for resilience
    const results = await Promise.allSettled([
      syncCategories(store, storeId),
      syncTags(store, storeId),
      syncBrands(store, storeId)
    ])
    
    // Extract results with graceful error handling
    const categoriesResult = results[0].status === 'fulfilled' 
      ? results[0].value 
      : { 
          created: 0, 
          updated: 0, 
          failed: 1, 
          errors: [{ type: 'categories', error: results[0].reason.message }] 
        }

    const tagsResult = results[1].status === 'fulfilled'
      ? results[1].value
      : { 
          created: 0, 
          updated: 0, 
          failed: 1, 
          errors: [{ type: 'tags', error: results[1].reason.message }] 
        }

    const brandsResult = results[2].status === 'fulfilled'
      ? results[2].value
      : { 
          created: 0, 
          updated: 0, 
          failed: 1, 
          errors: [{ type: 'brands', error: results[2].reason.message }] 
        }
    
    const duration = Date.now() - startTime

    // Log results for each taxonomy type
    if (categoryLogId) {
      if (categoriesResult.failed > 0) {
        await logSyncError(supabaseAdmin, {
          store_id: storeId,
          entity_type: 'category',
          error_message: categoriesResult.errors?.[0]?.error || 'Unknown error',
          metadata: { created: categoriesResult.created, updated: categoriesResult.updated }
        }, categoryLogId)
      } else {
        await logSyncSuccess(supabaseAdmin, categoryLogId, {
          duration_ms: duration,
          metadata: { created: categoriesResult.created, updated: categoriesResult.updated }
        })
      }
    }

    if (tagLogId) {
      if (tagsResult.failed > 0) {
        await logSyncError(supabaseAdmin, {
          store_id: storeId,
          entity_type: 'tag',
          error_message: tagsResult.errors?.[0]?.error || 'Unknown error',
          metadata: { created: tagsResult.created, updated: tagsResult.updated }
        }, tagLogId)
      } else {
        await logSyncSuccess(supabaseAdmin, tagLogId, {
          duration_ms: duration,
          metadata: { created: tagsResult.created, updated: tagsResult.updated }
        })
      }
    }

    if (brandLogId) {
      if (brandsResult.failed > 0) {
        await logSyncError(supabaseAdmin, {
          store_id: storeId,
          entity_type: 'brand',
          error_message: brandsResult.errors?.[0]?.error || 'Unknown error',
          metadata: { created: brandsResult.created, updated: brandsResult.updated }
        }, brandLogId)
      } else {
        await logSyncSuccess(supabaseAdmin, brandLogId, {
          duration_ms: duration,
          metadata: { created: brandsResult.created, updated: brandsResult.updated }
        })
      }
    }
    
    const totalCreated = categoriesResult.created + tagsResult.created + brandsResult.created
    const totalUpdated = categoriesResult.updated + tagsResult.updated + brandsResult.updated
    const totalFailed = categoriesResult.failed + tagsResult.failed + brandsResult.failed
    const totalSynced = totalCreated + totalUpdated
    const totalItems = totalSynced + totalFailed
    
    // Log to taxonomy_sync_log
    const supabase = createSupabaseClient()
    await supabase.from('taxonomy_sync_log').insert({
      store_id: storeId,
      taxonomy_type: 'all',
      action: 'initial_sync',
      items_synced: totalSynced,
      items_created: totalCreated,
      items_updated: totalUpdated,
      items_failed: totalFailed,
      duration_ms: duration,
      error_details: totalFailed > 0 ? {
        categories: categoriesResult.errors,
        tags: tagsResult.errors,
        brands: brandsResult.errors
      } : null
    })
    
    console.log(`✅ Taxonomy sync complete in ${duration}ms`)
    
    // Build response message
    let message = undefined
    if (totalFailed > 0 && totalSynced > 0) {
      message = `${totalSynced}/${totalItems} items synced successfully`
      if (brandsResult.failed > 0 && brandsResult.errors?.[0]?.error?.includes('404')) {
        message += ' (brands not supported)'
      }
    }
    
    return createResponse({
      success: totalFailed === 0,
      duration,
      results: {
        categories: categoriesResult,
        tags: tagsResult,
        brands: brandsResult
      },
      summary: {
        created: totalCreated,
        updated: totalUpdated,
        failed: totalFailed
      },
      message
    }, 200)
    
  } catch (error: any) {
    console.error('❌ Taxonomy sync failed:', error)
    
    return createResponse({
      error: error.message,
      stack: error.stack
    }, 500)
  }
}))
