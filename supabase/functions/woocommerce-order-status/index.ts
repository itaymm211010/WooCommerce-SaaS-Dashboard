
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { id, status } = body

    // Find the store_id based on the order's woo_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('store_id, status')
      .eq('woo_id', id)
      .single()

    if (orderError || !order) {
      console.error('Error finding order:', orderError)
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // עדכון סטטוס ההזמנה
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('woo_id', id)
      .eq('store_id', order.store_id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      throw updateError
    }

    // הוספת רשומה לטבלת הלוג
    const { error: logError } = await supabase
      .from('order_status_logs')
      .insert({
        store_id: order.store_id,
        order_id: id,
        old_status: order.status,
        new_status: status,
        changed_by: 'WooCommerce'
      })

    if (logError) {
      console.error('Error creating log:', logError)
      throw logError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
