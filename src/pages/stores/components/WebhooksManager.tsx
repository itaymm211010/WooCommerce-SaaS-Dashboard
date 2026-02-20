
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { webhookTypes, webhookCategories } from "@/types/webhook";
import { getWebhookEndpoint, createWebhook } from "../utils/webhookUtils";
import { checkAndUpdateStoreCurrency } from "../utils/currencyUtils";
import { WebhooksTable } from "./WebhooksTable";
import { WebhookSecretManager } from "./WebhookSecretManager";
import { WebhookLogsViewer } from "./WebhookLogsViewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Copy, Webhook as WebhookIcon } from "lucide-react";

type Store = Tables<"stores">;

interface WebhooksManagerProps {
  store: Store;
}

export function WebhooksManager({ store }: WebhooksManagerProps) {
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    checkAndUpdateStoreCurrency(store);
  }, [store]);

  const { data: webhooks, refetch } = useQuery({
    queryKey: ['webhooks', store.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const activeTopics = new Set(webhooks?.map(w => w.topic) || []);
  const availableTypes = webhookTypes.filter(t => !activeTopics.has(t.value));

  const handleCreate = async () => {
    if (!selectedTopic) return;

    const existingWebhook = webhooks?.find(w => w.topic === selectedTopic);
    if (existingWebhook) {
      toast.error('Webhook מסוג זה כבר קיים');
      return;
    }

    const typeInfo = webhookTypes.find(t => t.value === selectedTopic);
    if (!typeInfo) return;

    setIsCreating(true);
    try {
      const success = await createWebhook(store, selectedTopic, typeInfo.label);
      if (success) {
        refetch();
        setSelectedTopic('');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(getWebhookEndpoint(store.id));
    toast.success('כתובת ה-Webhook הועתקה');
  };

  const endpointUrl = getWebhookEndpoint(store.id);

  return (
    <div className="space-y-6">

      {/* Webhook Secret */}
      <WebhookSecretManager store={store} />

      {/* Create New Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            הוסף Webhook חדש
          </CardTitle>
          <CardDescription>
            בחר אירוע — WooCommerce ישלח עדכון לאפליקציה בכל פעם שהאירוע מתרחש
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Endpoint URL display */}
          <div className="rounded-md bg-muted p-3 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">כתובת קבלת Webhooks:</p>
            <div className="flex items-center gap-2">
              <code className="text-xs break-all flex-1">{endpointUrl}</code>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopyEndpoint}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Topic selector + button */}
          <div className="flex gap-3">
            <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={availableTypes.length === 0}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={availableTypes.length === 0 ? 'כל ה-Webhooks פעילים' : 'בחר אירוע...'} />
              </SelectTrigger>
              <SelectContent>
                {webhookCategories.map(category => {
                  const categoryTypes = availableTypes.filter(t => t.category === category.value);
                  if (categoryTypes.length === 0) return null;
                  return (
                    <SelectGroup key={category.value}>
                      <SelectLabel>{category.label}</SelectLabel>
                      {categoryTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>

            <Button
              onClick={handleCreate}
              disabled={isCreating || !selectedTopic}
            >
              {isCreating
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />יוצר...</>
                : <><Plus className="mr-2 h-4 w-4" />הוסף</>
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <WebhookIcon className="h-5 w-5" />
              Webhooks פעילים
            </CardTitle>
            {webhooks && webhooks.length > 0 && (
              <Badge variant="secondary">{webhooks.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <WebhooksTable
            webhooks={webhooks || []}
            store={store}
            onWebhookUpdated={refetch}
          />
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <WebhookLogsViewer store={store} />
    </div>
  );
}
