
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;
import { Package, ShoppingCart, Users, Webhook, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhooksManager } from "./WebhooksManager";
import { toast } from "sonner";

interface StoreDetailsProps {
  store: Store;
}

const currencyLabels: Record<string, string> = {
  GBP: "British Pound (£)",
  USD: "US Dollar ($)",
  EUR: "Euro (€)",
};

export function StoreDetails({ store }: StoreDetailsProps) {
  const [currentTab, setCurrentTab] = useState<string>("details");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const copyToClipboard = async (text: string, type: 'key' | 'secret') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'key') {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      }
      toast.success('הועתק ללוח');
    } catch (err) {
      toast.error('שגיאה בהעתקה');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-2 w-[400px] mb-4">
          <TabsTrigger value="details">פרטי החנות</TabsTrigger>
          <TabsTrigger value="webhooks">ווב-הוקים</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <Label>שם החנות</Label>
            <div className="rounded-md border p-2">{store.name}</div>
          </div>
          <div className="space-y-2">
            <Label>כתובת האתר</Label>
            <div className="rounded-md border p-2">
              <a href={store.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                {store.url}
              </a>
            </div>
          </div>
          <div className="space-y-2">
            <Label>מפתח API</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border p-2 font-mono text-sm">
                {showApiKey ? store.api_key : '••••••••••••••••••••••••••••••••'}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
                title={showApiKey ? 'הסתר' : 'הצג'}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(store.api_key, 'key')}
                title="העתק"
              >
                {copiedKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>סוד API</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border p-2 font-mono text-sm">
                {showApiSecret ? store.api_secret : '••••••••••••••••••••••••••••••••'}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiSecret(!showApiSecret)}
                title={showApiSecret ? 'הסתר' : 'הצג'}
              >
                {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(store.api_secret, 'secret')}
                title="העתק"
              >
                {copiedSecret ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>מטבע</Label>
            <div className="rounded-md border p-2">
              {currencyLabels[store.currency] || store.currency}
            </div>
          </div>
          <div className="space-y-2">
            <Label>נוצר בתאריך</Label>
            <div className="rounded-md border p-2">
              {new Date(store.created_at).toLocaleString()}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="webhooks">
          <WebhooksManager store={store} />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <Link to={`/stores/${store.id}/products`} className="flex-1">
          <Button className="w-full" variant="outline">
            <Package className="h-4 w-4" />
            <span className="ms-2">מוצרים</span>
          </Button>
        </Link>
        <Link to={`/stores/${store.id}/orders`} className="flex-1">
          <Button className="w-full" variant="outline">
            <ShoppingCart className="h-4 w-4" />
            <span className="ms-2">הזמנות</span>
          </Button>
        </Link>
        <Link to={`/stores/${store.id}/users`} className="flex-1">
          <Button className="w-full" variant="outline">
            <Users className="h-4 w-4" />
            <span className="ms-2">משתמשים</span>
          </Button>
        </Link>
        <Link to={`/stores/${store.id}/webhooks`} className="flex-1">
          <Button className="w-full" variant="outline">
            <Webhook className="h-4 w-4" />
            <span className="ms-2">ווב-הוקים</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
