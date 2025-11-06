import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withAuth, verifyStoreAccess } from "../_shared/auth-middleware.ts";
import { getStoreCredentials } from "../_shared/store-utils.ts";

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
    const { storeId, endpoint, method = "GET", body } = await req.json() as ProxyRequest;

    if (!storeId || !endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: storeId, endpoint" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const store = await getStoreCredentials(supabase, storeId);

    // Build WooCommerce URL
    let baseUrl = store.url.replace(/\/+$/, "");
    if (!baseUrl.startsWith("http")) {
      baseUrl = `https://${baseUrl}`;
    }

    const fullUrl = `${baseUrl}${endpoint}`;

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
