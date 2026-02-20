
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { Webhook, webhookTypes } from "@/types/webhook";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Play, Pause, Webhook as WebhookIcon } from "lucide-react";
import { toggleWebhookStatus, deleteWebhook } from "../utils/webhookUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Store = Tables<"stores">;

interface WebhooksTableProps {
  webhooks: Webhook[];
  store: Store;
  onWebhookUpdated: () => void;
}

export function WebhooksTable({ webhooks, store, onWebhookUpdated }: WebhooksTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleToggle = async (webhook: Webhook) => {
    setTogglingId(webhook.id);
    try {
      const success = await toggleWebhookStatus(webhook.woo_webhook_id || 0, store, webhook.status);
      if (success) onWebhookUpdated();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (webhook: Webhook) => {
    setDeletingId(webhook.id);
    setConfirmDeleteId(null);
    try {
      const success = await deleteWebhook(webhook.woo_webhook_id || 0, store);
      if (success) onWebhookUpdated();
    } finally {
      setDeletingId(null);
    }
  };

  if (!webhooks || webhooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground gap-3">
        <WebhookIcon className="h-10 w-10 opacity-30" />
        <p className="font-medium">אין webhooks מוגדרים</p>
        <p className="text-sm">צור webhook חדש כדי לקבל עדכונים מ-WooCommerce בזמן אמת</p>
      </div>
    );
  }

  const webhookToDelete = webhooks.find(w => w.id === confirmDeleteId);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>אירוע</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead className="text-right">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks.map((webhook) => {
            const typeInfo = webhookTypes.find(t => t.value === webhook.topic);
            const isToggling = togglingId === webhook.id;
            const isDeleting = deletingId === webhook.id;
            const isActive = webhook.status === 'active';

            return (
              <TableRow key={webhook.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{typeInfo?.label || webhook.topic}</p>
                    <p className="text-xs text-muted-foreground font-mono">{webhook.topic}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'פעיל' : 'מושהה'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggle(webhook)}
                      disabled={isToggling || isDeleting}
                      title={isActive ? 'השהה' : 'הפעל'}
                    >
                      {isToggling
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : isActive
                          ? <Pause className="h-4 w-4 text-muted-foreground" />
                          : <Play className="h-4 w-4 text-muted-foreground" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDeleteId(webhook.id)}
                      disabled={isDeleting || isToggling}
                      title="מחק"
                    >
                      {isDeleting
                        ? <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                        : <Trash2 className="h-4 w-4 text-destructive" />
                      }
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את ה-webhook עבור{' '}
              <span className="font-semibold">
                {webhookTypes.find(t => t.value === webhookToDelete?.topic)?.label || webhookToDelete?.topic}
              </span>
              ?<br />
              ה-webhook יימחק גם מ-WooCommerce. פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => webhookToDelete && handleDelete(webhookToDelete)}
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
