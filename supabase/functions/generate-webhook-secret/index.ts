import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withAuth, verifyStoreAccess } from "../shared/auth-middleware.ts"
import { generateWebhookSecretRequestSchema, validateRequest } from "../shared/validation-schemas.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Generates a cryptographically secure random webhook secret
 * Uses 32 bytes (256 bits) for strong security
 */
function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)

  // Convert to base64 for easy storage and transmission
  return btoa(String.fromCharCode(...bytes))
}

serve(withAuth(async (req, auth) => {
  try {
    // Parse and validate request body
    const body = await req.json()

    const validation = validateRequest(generateWebhookSecretRequestSchema, body)
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

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Generate new webhook secret
    const webhookSecret = generateWebhookSecret()

    // Update store with new webhook secret
    const { error: updateError } = await supabase
      .from('stores')
      .update({ webhook_secret: webhookSecret })
      .eq('id', store_id)

    if (updateError) {
      console.error('Error updating webhook secret:', updateError)
      return new Response(JSON.stringify({
        error: 'Failed to update webhook secret'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log(`✅ Generated new webhook secret for store: ${store_id}`)

    return new Response(JSON.stringify({
      success: true,
      webhook_secret: webhookSecret,
      message: 'Webhook secret generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in generate-webhook-secret function:', error)

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}))
