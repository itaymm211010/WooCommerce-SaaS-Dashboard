
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AddStoreFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddStoreForm({ onSuccess, onCancel }: AddStoreFormProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('stores').insert({
        name,
        url,
        api_key: apiKey,
        api_secret: apiSecret,
        user_id: '0244961a-6c5f-4f54-89a9-0c0555286e6e'
      });

      if (error) throw error;

      toast.success("Store added successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to add store");
      console.error('Error adding store:', error);
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
        />
      </div>
      <Button type="submit" className="w-full">
        Add Store
      </Button>
    </form>
  );
}
