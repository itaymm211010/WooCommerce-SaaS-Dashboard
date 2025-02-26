
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Store } from "@/types/database";
import { Package, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

interface StoreDetailsProps {
  store: Store;
}

const currencyLabels: Record<string, string> = {
  GBP: "British Pound (£)",
  USD: "US Dollar ($)",
  EUR: "Euro (€)",
};

export function StoreDetails({ store }: StoreDetailsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Store Name</Label>
        <div className="rounded-md border p-2">{store.name}</div>
      </div>
      <div className="space-y-2">
        <Label>Store URL</Label>
        <div className="rounded-md border p-2">
          <a href={store.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {store.url}
          </a>
        </div>
      </div>
      <div className="space-y-2">
        <Label>API Key</Label>
        <div className="rounded-md border p-2 font-mono text-sm">
          {store.api_key}
        </div>
      </div>
      <div className="space-y-2">
        <Label>API Secret</Label>
        <div className="rounded-md border p-2 font-mono text-sm">
          {store.api_secret}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <div className="rounded-md border p-2">
          {currencyLabels[store.currency] || store.currency}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Created At</Label>
        <div className="rounded-md border p-2">
          {new Date(store.created_at).toLocaleString()}
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <Link to={`/stores/${store.id}/products`} className="flex-1">
          <Button className="w-full" variant="outline">
            <Package className="mr-2 h-4 w-4" />
            Products
          </Button>
        </Link>
        <Link to={`/stores/${store.id}/orders`} className="flex-1">
          <Button className="w-full" variant="outline">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders
          </Button>
        </Link>
      </div>
    </div>
  );
}
