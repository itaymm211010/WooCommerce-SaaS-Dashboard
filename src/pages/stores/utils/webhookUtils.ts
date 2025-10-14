
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;
import { supabase } from "@/integrations/supabase/client";
import { Webhook } from "@/types/webhook";
import { toast } from "sonner";

export const getWebhookEndpoint = (storeId: string) => {
  return `https://wzpbsridzmqrcztafzip.functions.supabase.co/woocommerce-order-status?store_id=${storeId}`;
};

export async function deleteWebhook(webhookId: number, store: Store) {
  try {
    let baseUrl = store.url.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }

    console.log('Deleting webhook from WooCommerce:', webhookId);
    
    const response = await fetch(
      `${baseUrl}/wp-json/wc/v3/webhooks/${webhookId}?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          status: 'deleted'
        })
      }
    );

    if (!response.ok) {
      console.error('WooCommerce webhook delete response:', await response.text());
      throw new Error('Failed to delete webhook from WooCommerce');
    }

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('webhook_id', webhookId)
      .eq('store_id', store.id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }

    toast.success('Webhook deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting webhook:', error);
    toast.error('Failed to delete webhook');
    return false;
  }
}

export async function toggleWebhookStatus(webhookId: number, store: Store, currentStatus: string) {
  try {
    let baseUrl = store.url.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }

    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    const response = await fetch(
      `${baseUrl}/wp-json/wc/v3/webhooks/${webhookId}?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update webhook status');
    }

    const { error } = await supabase
      .from('webhooks')
      .update({ status: newStatus })
      .eq('webhook_id', webhookId)
      .eq('store_id', store.id);

    if (error) throw error;

    toast.success(`Webhook ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    return true;
  } catch (error) {
    console.error('Error toggling webhook status:', error);
    toast.error('Failed to update webhook status');
    return false;
  }
}

export async function createWebhook(store: Store, selectedWebhookType: string, selectedTypeLabel: string) {
  try {
    const endpoint = getWebhookEndpoint(store.id);
    let baseUrl = store.url.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }

    const response = await fetch(
      `${baseUrl}/wp-json/wc/v3/webhooks?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: `Lovable - ${selectedTypeLabel}`,
          topic: selectedWebhookType,
          delivery_url: endpoint,
          status: 'active'
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create webhook: ${errorData.message || 'Unknown error'}`);
    }

    const webhook = await response.json();

    const { error } = await supabase
      .from('webhooks')
      .insert({
        store_id: store.id,
        webhook_id: webhook.id,
        topic: webhook.topic,
        status: webhook.status
      });

    if (error) throw error;

    toast.success("Webhook created successfully");
    return true;
  } catch (error) {
    console.error('Error creating webhook:', error);
    toast.error(`Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}
