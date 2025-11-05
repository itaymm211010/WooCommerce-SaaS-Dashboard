import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Key, RefreshCw, Copy, Eye, EyeOff, AlertTriangle } from "lucide-react";
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

interface WebhookSecretManagerProps {
  store: Store;
  onSecretGenerated?: (secret: string) => void;
}

export function WebhookSecretManager({ store, onSecretGenerated }: WebhookSecretManagerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [localSecret, setLocalSecret] = useState<string | null>(store.webhook_secret || null);

  const hasSecret = !!localSecret;

  const handleGenerateSecret = async () => {
    try {
      setIsGenerating(true);

      const { data, error } = await supabase.functions.invoke('generate-webhook-secret', {
        body: { store_id: store.id }
      });

      if (error) {
        throw error;
      }

      if (data.success && data.webhook_secret) {
        setLocalSecret(data.webhook_secret);
        setShowSecret(true);
        toast.success(hasSecret ? 'Webhook secret regenerated successfully' : 'Webhook secret generated successfully');
        onSecretGenerated?.(data.webhook_secret);
      } else {
        throw new Error('Failed to generate webhook secret');
      }
    } catch (error: any) {
      console.error('Error generating webhook secret:', error);
      toast.error(error.message || 'Failed to generate webhook secret');
    } finally {
      setIsGenerating(false);
      setShowConfirmDialog(false);
    }
  };

  const handleCopySecret = () => {
    if (localSecret) {
      navigator.clipboard.writeText(localSecret);
      toast.success('Webhook secret copied to clipboard');
    }
  };

  const handleRegenerateClick = () => {
    if (hasSecret) {
      setShowConfirmDialog(true);
    } else {
      handleGenerateSecret();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Webhook Secret
          </CardTitle>
          <CardDescription>
            Secure secret key used to verify webhook signatures from WooCommerce.
            This ensures that webhooks are authentic and haven't been tampered with.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasSecret ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Secret Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="webhook-secret"
                      type={showSecret ? "text" : "password"}
                      value={localSecret}
                      readOnly
                      className="font-mono text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this secret key when configuring webhooks in your WooCommerce store settings.
                </p>
              </div>

              <Button
                onClick={handleRegenerateClick}
                variant="outline"
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Secret
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-800">
                      No webhook secret configured
                    </p>
                    <p className="text-sm text-yellow-700">
                      Generate a secret key to secure your webhooks. Without this, webhook
                      signatures cannot be verified and your webhooks may be vulnerable to attacks.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateSecret}
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Generate Webhook Secret
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Webhook Secret?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will generate a new secret key and invalidate the existing one.
              </p>
              <p className="font-semibold text-destructive">
                All existing webhooks using the old secret will fail verification until you
                update them in WooCommerce with the new secret.
              </p>
              <p>
                Make sure to update your WooCommerce webhook settings immediately after
                regenerating the secret.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerateSecret}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Regenerate Secret
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
