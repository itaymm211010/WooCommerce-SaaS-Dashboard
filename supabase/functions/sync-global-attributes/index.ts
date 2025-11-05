import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withAuth, verifyStoreAccess } from "../_shared/auth-middleware.ts"
import { getStoreDetails } from "../_shared/store-utils.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(withAuth(async (req, auth) => {
  try {
    const { store_id } = await req.json()

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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get store details with credentials
    const store = await getStoreDetails(store_id)

    // Format base URL
    let baseUrl = store.url.replace(/\/+$/, '')
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`
    }

    // Fetch global attributes from WooCommerce
    console.log('Fetching global attributes from WooCommerce...')
    const response = await fetch(
      `${baseUrl}/wp-json/wc/v3/products/attributes?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}&per_page=100`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`)
    }

    const attributes = await response.json()
    console.log(`Found ${attributes.length} global attributes in WooCommerce`)

    let synced = 0
    let created = 0
    let updated = 0

    // Sync each attribute
    for (const attr of attributes) {
      const { data: existing } = await supabase
        .from('store_attributes')
        .select('id')
        .eq('store_id', store_id)
        .eq('woo_id', attr.id)
        .maybeSingle()

      const attributeData = {
        store_id,
        woo_id: attr.id,
        name: attr.name,
        slug: attr.slug,
        type: attr.type || 'select',
        order_by: attr.order_by || 'menu_order',
        has_archives: attr.has_archives || false,
        updated_at: new Date().toISOString()
      }

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('store_attributes')
          .update(attributeData)
          .eq('id', existing.id)

        if (error) {
          console.error(`Error updating attribute ${attr.name}:`, error)
        } else {
          updated++
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('store_attributes')
          .insert(attributeData)

        if (error) {
          console.error(`Error creating attribute ${attr.name}:`, error)
        } else {
          created++
        }
      }
      synced++
    }

    console.log(`✅ Synced ${synced} attributes (${created} created, ${updated} updated)`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${synced} global attributes`,
        stats: {
          total: synced,
          created,
          updated
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Error syncing global attributes:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
}))
