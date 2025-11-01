import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the service role key
export function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

// Format the base URL for API requests
export function formatBaseUrl(url: string): string {
  let baseUrl = url.replace(/\/+$/, '')
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`
  }
  return baseUrl
}

/**
 * Fetch with exponential backoff retry logic
 * 
 * TODO: Refactor to WooCommerceManager when scaling to 50+ stores
 * Current approach is sufficient for MVP (10-20 stores).
 * 
 * When to refactor:
 * - Scale: 50+ stores
 * - Issue: Frequent rate limit errors (429)
 * - Effort: 2-3 hours
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      
      if (response.ok) {
        return response
      }
      
      // Rate limit - exponential backoff
      if (response.status === 429) {
        const delay = 1000 * Math.pow(2, i)
        console.log(`⚠️ Rate limited, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = 500 * Math.pow(2, i)
      console.log(`⚠️ Request failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Helper to create responses with CORS headers
export function createResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status
    }
  )
}
