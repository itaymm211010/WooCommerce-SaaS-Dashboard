
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
