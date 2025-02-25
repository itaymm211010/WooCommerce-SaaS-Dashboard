
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Store } from "@/types/database";
import { Webhook, WebhookType, webhookTypes } from "@/types/webhook";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface WebhooksManagerProps {
  store: Store;
}

export function WebhooksManager({ store }: WebhooksManagerProps) {
  const [selectedWebhookType, setSelectedWebhookType] = useState<string>('order.updated');
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);

  const { data: webhooks, refetch: refetchWebhooks } = useQuery({
    queryKey: ['webhooks', store.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('store_id', store.id);
      if (error) throw error;
      return data as Webhook[];
    }
  });

  const getWebhookEndpoint = (storeId: string) => {
    return `https://wzpbsridzmqrcztafzip.functions.supabase.co/woocommerce-order-status?store_id=${storeId}`;
  };

  const createWebhook = async () => {
    try {
      const existingWebhook = webhooks?.find(webhook => webhook.topic === selectedWebhookType);
      if (existingWebhook) {
        toast.error("A webhook of this type already exists");
        return;
      }

      setIsCreatingWebhook(true);
      const endpoint = getWebhookEndpoint(store.id);

      let baseUrl = store.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      const selectedType = webhookTypes.find(type => type.value === selectedWebhookType);
      if (!selectedType) return;

      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/webhooks?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: `Lovable - ${selectedType.label}`,
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
      refetchWebhooks();
      setSelectedWebhookType('order.updated');
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error(`Failed to create webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const toggleWebhookStatus = async (webhookId: number, storeId: string, currentStatus: string) => {
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
        .eq('store_id', storeId);

      if (error) throw error;

      toast.success(`Webhook ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      refetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook status:', error);
      toast.error('Failed to update webhook status');
    }
  };

  const deleteWebhook = async (webhookId: number, storeId: string) => {
    try {
      let baseUrl = store.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      const response = await fetch(
        `${baseUrl}/wp-json/wc/v3/webhooks/${webhookId}?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
        {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }

      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('webhook_id', webhookId)
        .eq('store_id', storeId);

      if (error) throw error;

      toast.success('Webhook deleted');
      refetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Add New Webhook</Label>
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p>Select the type of webhook you want to create. The webhook endpoint URL will be automatically set to our secure endpoint.</p>
            <p className="mt-2 break-all font-mono text-xs">
              {getWebhookEndpoint(store.id)}
            </p>
          </div>
          <div className="space-y-4">
            <Select
              value={selectedWebhookType}
              onValueChange={setSelectedWebhookType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select webhook type" />
              </SelectTrigger>
              <SelectContent>
                {webhookTypes
                  .filter(type => !webhooks?.some(webhook => webhook.topic === type.value))
                  .map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="space-y-1">
                        <div>{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={createWebhook}
              className="w-full"
              disabled={isCreatingWebhook || !selectedWebhookType}
            >
              {isCreatingWebhook ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Webhook...
                </>
              ) : (
                'Add Webhook'
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Active Webhooks</Label>
        <div className="rounded-md border">
          {webhooks && webhooks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.webhook_id}>
                    <TableCell>
                      {webhookTypes.find(type => type.value === webhook.topic)?.label || webhook.topic}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={webhook.status}
                        onValueChange={(value) => toggleWebhookStatus(webhook.webhook_id, webhook.store_id, webhook.status)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWebhook(webhook.webhook_id, webhook.store_id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No webhooks configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
