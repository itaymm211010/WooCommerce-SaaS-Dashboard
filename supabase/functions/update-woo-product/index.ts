
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleRequest } from "./handlers.ts"
import { corsHeaders } from "./utils.ts"

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    return await handleRequest(req)
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
