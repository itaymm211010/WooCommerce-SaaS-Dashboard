
import { Store } from "@/types/database";
import { Webhook, webhookTypes } from "@/types/webhook";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { toggleWebhookStatus, deleteWebhook } from "../utils/webhookUtils";

interface WebhooksTableProps {
  webhooks: Webhook[];
  store: Store;
  isDeletingWebhook: boolean;
  onWebhookUpdated: () => void;
}

export function WebhooksTable({ webhooks, store, isDeletingWebhook, onWebhookUpdated }: WebhooksTableProps) {
  if (!webhooks || webhooks.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No webhooks configured
      </div>
    );
  }

  return (
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
                onValueChange={async (value) => {
                  const success = await toggleWebhookStatus(webhook.webhook_id, store, webhook.status);
                  if (success) onWebhookUpdated();
                }}
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
                onClick={async () => {
                  const success = await deleteWebhook(webhook.webhook_id, store);
                  if (success) onWebhookUpdated();
                }}
                disabled={isDeletingWebhook}
              >
                {isDeletingWebhook ? (
                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
