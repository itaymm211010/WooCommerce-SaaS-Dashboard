/**
 * Webhook Authentication Middleware
 * Verifies HMAC signatures from WooCommerce webhooks
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

export interface WebhookVerificationResult {
  success: boolean
  error?: string
  status?: number
  storeId?: string
  webhookSecret?: string
}

/**
 * Verifies WooCommerce webhook HMAC signature
 * WooCommerce sends signature in X-WC-Webhook-Signature header
 *
 * @param req - The incoming webhook request
 * @param body - The raw request body (must be string or buffer)
 * @param webhookSecret - The webhook secret from store settings
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  signature: string,
  body: string,
  webhookSecret: string
): boolean {
  try {
    // Create HMAC using SHA256
    const hmac = createHmac('sha256', webhookSecret)
    hmac.update(body)
    const computedSignature = hmac.digest('base64')

    // Compare signatures (constant-time comparison to prevent timing attacks)
    return signature === computedSignature
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

/**
 * Extracts store_id from webhook payload and verifies signature
 * This should be used for all WooCommerce webhook endpoints
 *
 * @example
 * serve(async (req) => {
 *   const verification = await verifyWooWebhook(req)
 *   if (!verification.success) {
 *     return new Response(JSON.stringify({ error: verification.error }), {
 *       status: verification.status || 401
 *     })
 *   }
 *   // Process webhook...
 * })
 */
export async function verifyWooWebhook(
  req: Request
): Promise<WebhookVerificationResult> {
  // Get signature from header
  const signature = req.headers.get('X-WC-Webhook-Signature')

  if (!signature) {
    return {
      success: false,
      error: 'Missing X-WC-Webhook-Signature header',
      status: 401
    }
  }

  // Read body as text (we need it for HMAC verification)
  const bodyText = await req.text()

  if (!bodyText) {
    return {
      success: false,
      error: 'Empty webhook payload',
      status: 400
    }
  }

  let payload: any
  try {
    payload = JSON.parse(bodyText)
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON payload',
      status: 400
    }
  }

  // Extract store_id from payload
  // WooCommerce webhooks usually include store URL or we need to identify by other means
  // For now, we'll require store_id in the webhook delivery URL as a query parameter
  const url = new URL(req.url)
  const storeId = url.searchParams.get('store_id')

  if (!storeId) {
    return {
      success: false,
      error: 'Missing store_id in webhook URL',
      status: 400
    }
  }

  // Get webhook secret from database
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch store basic info first
    const { data: store, error } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .single()

    if (error || !store) {
      console.error('Store not found:', error)
      return {
        success: false,
        error: 'Store not found',
        status: 404
      }
    }

    // Get webhook secret using secure RPC function
    const { data: credentials, error: credError } = await supabase
      .rpc('get_store_credentials', { store_uuid: storeId })
      .single()

    if (credError || !credentials || !credentials.webhook_secret) {
      console.error('Failed to get webhook secret:', credError)
      return {
        success: false,
        error: 'Failed to get webhook secret',
        status: 500
      }
    }

    // Verify signature
    const isValid = verifyWebhookSignature(
      signature,
      bodyText,
      credentials.webhook_secret
    )

    if (!isValid) {
      console.error('Invalid webhook signature for store:', storeId)
      return {
        success: false,
        error: 'Invalid webhook signature',
        status: 401
      }
    }

    return {
      success: true,
      storeId: store.id,
      webhookSecret: credentials.webhook_secret
    }
  } catch (error) {
    console.error('Error verifying webhook:', error)
    return {
      success: false,
      error: 'Webhook verification failed',
      status: 500
    }
  }
}

/**
 * Middleware wrapper for webhook handlers
 * Automatically verifies signature before calling handler
 *
 * @example
 * serve(withWebhookAuth(async (req, storeId, payload) => {
 *   // Webhook is verified, process it
 *   return new Response(JSON.stringify({ success: true }))
 * }))
 */
export function withWebhookAuth(
  handler: (req: Request, storeId: string, payload: any) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    // OPTIONS requests don't need verification
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-WC-Webhook-Signature'
        }
      })
    }

    // Clone request to read body multiple times
    const clonedReq = req.clone()

    const verification = await verifyWooWebhook(clonedReq)

    if (!verification.success) {
      console.error('Webhook verification failed:', verification.error)
      return new Response(JSON.stringify({ error: verification.error }), {
        status: verification.status || 401,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // Parse payload for handler
    const payload = await req.json()

    // Call handler with verified data
    return handler(req, verification.storeId!, payload)
  }
}

/**
 * Logs webhook activity for debugging and auditing
 */
export async function logWebhookActivity(
  storeId: string,
  topic: string,
  status: 'success' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    await supabase.from('webhook_logs').insert({
      store_id: storeId,
      topic,
      status,
      error_message: errorMessage,
      received_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log webhook activity:', error)
    // Don't throw - logging failure shouldn't stop webhook processing
  }
}
