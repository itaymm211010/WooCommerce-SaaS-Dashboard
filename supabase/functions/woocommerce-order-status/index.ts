
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // הוספת לוגים לדיבוג
  console.log('Received webhook request:', {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log('Webhook payload:', body);

    const { id, status } = body

    // מציאת ה-store_id על פי מזהה ההזמנה
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

    console.log('Found order:', order);

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

    console.log('Updated order status to:', status);

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

    console.log('Created status log entry');

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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
