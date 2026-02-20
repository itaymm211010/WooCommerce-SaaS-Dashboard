
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;
import { supabase } from "@/integrations/supabase/client";
import { Webhook } from "@/types/webhook";
import { toast } from "sonner";

export const getWebhookEndpoint = (storeId: string) => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.functions.supabase.co/woocommerce-order-status?store_id=${storeId}`;
};

export async function deleteWebhook(webhookId: number, store: Store) {
  try {
    console.log('Deleting webhook from WooCommerce:', webhookId);

    // Delete webhook via secure proxy
    const { data, error: fetchError } = await supabase.functions.invoke('woo-proxy', {
      body: {
        storeId: store.id,
        endpoint: `/wp-json/wc/v3/webhooks/${webhookId}`,
        method: 'PUT',
        body: {
          status: 'deleted'
        }
      }
    });

    if (fetchError || !data) {
      console.error('WooCommerce webhook delete error:', fetchError?.message || 'Unknown error');
      throw new Error('Failed to delete webhook from WooCommerce');
    }

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('woo_webhook_id', webhookId)
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
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';

    // Update webhook status via secure proxy
    const { data, error: fetchError } = await supabase.functions.invoke('woo-proxy', {
      body: {
        storeId: store.id,
        endpoint: `/wp-json/wc/v3/webhooks/${webhookId}`,
        method: 'PUT',
        body: {
          status: newStatus
        }
      }
    });

    if (fetchError || !data) {
      throw new Error('Failed to update webhook status');
    }

    const { error } = await supabase
      .from('webhooks')
      .update({ status: newStatus })
      .eq('woo_webhook_id', webhookId)
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

    // Create webhook via secure proxy
    const { data: webhook, error: fetchError } = await supabase.functions.invoke('woo-proxy', {
      body: {
        storeId: store.id,
        endpoint: '/wp-json/wc/v3/webhooks',
        method: 'POST',
        body: {
          name: `WooSaaS - ${selectedTypeLabel}`,
          topic: selectedWebhookType,
          delivery_url: endpoint,
          status: 'active'
        }
      }
    });

    if (fetchError || !webhook) {
      throw new Error(`Failed to create webhook: ${fetchError?.message || 'Unknown error'}`);
    }

    const { error } = await supabase
      .from('webhooks')
      .insert({
        store_id: store.id,
        woo_webhook_id: webhook.id,
        topic: webhook.topic,
        delivery_url: endpoint,
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
