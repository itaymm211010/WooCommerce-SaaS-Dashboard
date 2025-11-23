// Supabase Edge Function to proxy Coolify API requests
// This solves the Mixed Content issue (HTTPS -> HTTP)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const COOLIFY_URL = Deno.env.get('COOLIFY_API_URL') || 'http://91.99.207.249:8000';
const COOLIFY_TOKEN = Deno.env.get('COOLIFY_API_TOKEN') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/api/v1/applications';

    console.log('🔄 Proxying request to Coolify:', `${COOLIFY_URL}${path}`);

    // Forward the request to Coolify API
    const coolifyResponse = await fetch(`${COOLIFY_URL}${path}`, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${COOLIFY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    });

    const data = await coolifyResponse.json();

    console.log('✅ Coolify response:', coolifyResponse.status);

    return new Response(
      JSON.stringify(data),
      {
        status: coolifyResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('❌ Proxy error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to proxy request to Coolify API'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
