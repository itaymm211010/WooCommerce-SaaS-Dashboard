/**
 * Update WooCommerce Product Edge Function
 * Last deployment: 2025-11-09
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleRequest } from "./handlers.ts"
import { corsHeaders } from "./utils.ts"
import { withAuth, verifyStoreAccess } from "../shared/auth-middleware.ts"
import { updateWooProductRequestSchema, validateRequest } from "../shared/validation-schemas.ts"

serve(withAuth(async (req, auth) => {
  try {
    // Parse and validate request body
    const body = await req.json()

    const validation = validateRequest(updateWooProductRequestSchema, body)
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

    // Create new request with the body for handleRequest
    const newReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(body)
    })

    return await handleRequest(newReq)
  } catch (error) {
    console.error('Error in update-woo-product function:', error)

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}))
