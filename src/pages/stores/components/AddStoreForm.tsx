
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddStoreFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddStoreForm({ onSuccess, onCancel }: AddStoreFormProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to add a store');
      }

      // נקה את הURL מ-slashes בסוף
      let baseUrl = url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }

      // הוסף את החנות לדאטהבייס תחילה (עם מטבע default)
      const { data: newStore, error: insertError } = await supabase
        .from('stores')
        .insert({
          name,
          url: baseUrl,
          api_key: apiKey,
          api_secret: apiSecret,
          currency: 'USD', // Default currency, will be updated next
          user_id: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // קבל את הגדרות החנות מווקומרס דרך secure proxy
      const { data: settings, error: fetchError } = await supabase.functions.invoke('woo-proxy', {
        body: {
          storeId: newStore.id,
          endpoint: '/wp-json/wc/v3/settings/general',
          method: 'GET'
        }
      });

      if (fetchError || !settings) {
        console.error('Failed to fetch store settings:', fetchError?.message || 'Unknown error');
        // Don't fail the entire operation - store was created successfully
        toast.warning('Store added, but could not fetch currency settings');
      } else {
        // מצא את הגדרת המטבע
        const currencySetting = settings.find((setting: any) => setting.id === 'woocommerce_currency');

        if (currencySetting) {
          // עדכן את המטבע בדאטהבייס
          const { error: updateError } = await supabase
            .from('stores')
            .update({ currency: currencySetting.value })
            .eq('id', newStore.id);

          if (updateError) {
            console.error('Failed to update currency:', updateError);
          } else {
            console.log(`Currency set to ${currencySetting.value}`);
          }
        }
      }

      toast.success("Store added successfully");
      onSuccess();
    } catch (error) {
      console.error('Error adding store:', error);
      toast.error(error instanceof Error ? error.message : "Failed to add store");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Store Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Store"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">Store URL</Label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://mystore.com"
          type="url"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="ck_xxxxxxxxxxxxxxxxxxxx"
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="apiSecret">API Secret</Label>
        <Input
          id="apiSecret"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          type="password"
          placeholder="cs_xxxxxxxxxxxxxxxxxxxx"
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding Store...
          </>
        ) : (
          'Add Store'
        )}
      </Button>
    </form>
  );
}
