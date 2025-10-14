
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;
import { Package, ShoppingCart, Users, Webhook } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhooksManager } from "./WebhooksManager";

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
            <div className="rounded-md border p-2 font-mono text-sm">
              {store.api_key}
            </div>
          </div>
          <div className="space-y-2">
            <Label>סוד API</Label>
            <div className="rounded-md border p-2 font-mono text-sm">
              {store.api_secret}
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

      <div className="flex gap-4 pt-4">
        <Link to={`/stores/${store.id}/products`} className="flex-1">
          <Button className="w-full" variant="outline">
            <Package className="mr-2 h-4 w-4" />
            מוצרים
          </Button>
        </Link>
        <Link to={`/stores/${store.id}/orders`} className="flex-1">
          <Button className="w-full" variant="outline">
            <ShoppingCart className="mr-2 h-4 w-4" />
            הזמנות
          </Button>
        </Link>
        <Link to={`/stores/${store.id}/users`} className="flex-1">
          <Button className="w-full" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            משתמשים
          </Button>
        </Link>
      </div>
    </div>
  );
}
