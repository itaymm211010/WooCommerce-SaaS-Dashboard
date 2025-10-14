
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

      // קבל את הגדרות החנות מווקומרס
      const storeResponse = await fetch(
        `${baseUrl}/wp-json/wc/v3/settings/general?consumer_key=${apiKey}&consumer_secret=${apiSecret}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!storeResponse.ok) {
        throw new Error('Failed to fetch store settings. Please check your API credentials.');
      }

      const settings = await storeResponse.json();
      console.log('Store settings:', settings);
      
      // מצא את הגדרת המטבע
      const currencySetting = settings.find((setting: any) => setting.id === 'woocommerce_currency');
      if (!currencySetting) {
        throw new Error('Could not find currency setting in WooCommerce');
      }

      // הוסף את החנות לדאטהבייס עם המטבע שהתקבל מווקומרס
      const { error } = await supabase.from('stores').insert({
        name,
        url: baseUrl,
        api_key: apiKey,
        api_secret: apiSecret,
        currency: currencySetting.value,
        user_id: user.id
      });

      if (error) throw error;

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
