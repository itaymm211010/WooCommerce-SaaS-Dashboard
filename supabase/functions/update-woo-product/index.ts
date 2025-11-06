
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleRequest } from "./handlers.ts"
import { corsHeaders } from "./utils.ts"
import { withAuth, verifyStoreAccess } from "../_shared/auth-middleware.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  return withAuth(async (req, auth) => {
  try {
    // Parse request body to get store_id
    const body = await req.json()
    const { store_id } = body

    if (!store_id) {
      return new Response(JSON.stringify({
        error: 'Missing required parameter: store_id'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

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
  })(req)
})
