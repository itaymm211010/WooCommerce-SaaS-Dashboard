
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;
import { webhookTypes } from "@/types/webhook";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkAndUpdateStoreCurrency } from "../utils/currencyUtils";
import { getWebhookEndpoint, createWebhook } from "../utils/webhookUtils";
import { WebhooksTable } from "./WebhooksTable";
import { WebhookSecretManager } from "./WebhookSecretManager";
import { WebhookLogsViewer } from "./WebhookLogsViewer";

interface WebhooksManagerProps {
  store: Store;
}

export function WebhooksManager({ store }: WebhooksManagerProps) {
  const [selectedWebhookType, setSelectedWebhookType] = useState<string>('order.updated');
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [isDeletingWebhook, setIsDeletingWebhook] = useState(false);

  useEffect(() => {
    checkAndUpdateStoreCurrency(store);
  }, [store]);

  const { data: webhooks, refetch: refetchWebhooks } = useQuery({
    queryKey: ['webhooks', store.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('store_id', store.id);
      if (error) throw error;
      return data;
    }
  });

  const handleCreateWebhook = async () => {
    try {
      const existingWebhook = webhooks?.find(webhook => webhook.topic === selectedWebhookType);
      if (existingWebhook) {
        toast.error("A webhook of this type already exists");
        return;
      }

      setIsCreatingWebhook(true);
      const selectedType = webhookTypes.find(type => type.value === selectedWebhookType);
      if (!selectedType) return;

      const success = await createWebhook(store, selectedWebhookType, selectedType.label);
      if (success) {
        refetchWebhooks();
        setSelectedWebhookType('order.updated');
      }
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      <WebhookSecretManager store={store} />

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
              onClick={handleCreateWebhook}
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
          <WebhooksTable
            webhooks={webhooks || []}
            store={store}
            isDeletingWebhook={isDeletingWebhook}
            onWebhookUpdated={refetchWebhooks}
          />
        </div>
      </div>

      <div className="mt-8">
        <WebhookLogsViewer store={store} />
      </div>
    </div>
  );
}
