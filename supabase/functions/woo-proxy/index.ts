import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withAuth, verifyStoreAccess } from "../shared/auth-middleware.ts";
import { getStoreDetails } from "../shared/store-utils.ts";
import { wooProxyRequestSchema, validateRequest } from "../shared/validation-schemas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProxyRequest {
  storeId: string;
  endpoint: string; // e.g., "/wp-json/wc/v3/orders/123/notes"
  method?: string;
  body?: any;
}

serve(withAuth(async (req, auth) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();

    // Validate request body
    const validation = validateRequest(wooProxyRequestSchema, requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { storeId, endpoint, method = "GET", body, params } = validation.data;

    // Verify user has access to this store
    const accessCheck = await verifyStoreAccess(auth.userId, storeId);
    if (!accessCheck.success) {
      return new Response(
        JSON.stringify({ error: accessCheck.error }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Get store credentials securely
    const store = await getStoreDetails(storeId);

    // Build WooCommerce URL
    let baseUrl = store.url.replace(/\/+$/, "");
    if (!baseUrl.startsWith("http")) {
      baseUrl = `https://${baseUrl}`;
    }

    // Build URL with query params if provided
    const url = new URL(`${baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    const fullUrl = url.toString();

    // Make authenticated request to WooCommerce
    const authHeader = btoa(`${store.api_key}:${store.api_secret}`);

    const wooResponse = await fetch(fullUrl, {
      method,
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      ...(body && method !== "GET" ? { body: JSON.stringify(body) } : {}),
    });

    const responseData = await wooResponse.json();

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: wooResponse.status,
      }
    );
  } catch (error) {
    console.error("Error in woo-proxy:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}));
