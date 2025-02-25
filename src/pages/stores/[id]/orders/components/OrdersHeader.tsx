
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OrdersHeaderProps {
  storeName?: string;
  isSyncing: boolean;
  onSyncOrders: () => void;
  onSetupWebhook: () => void;
}

export function OrdersHeader({ 
  storeName, 
  isSyncing, 
  onSyncOrders, 
  onSetupWebhook 
}: OrdersHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Link to="/stores">
        <Button variant="ghost" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div className="flex-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {storeName ? `${storeName} - Orders` : 'Orders'}
        </h1>
        <p className="text-muted-foreground">
          Manage your store orders
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onSetupWebhook}
          variant="outline"
        >
          Setup Webhook
        </Button>
        <Button 
          onClick={onSyncOrders} 
          className="gap-2"
          disabled={isSyncing}
        >
          <RefreshCw className={cn(
            "h-4 w-4",
            isSyncing && "animate-spin"
          )} />
          {isSyncing ? 'Syncing...' : 'Sync Orders'}
        </Button>
      </div>
    </div>
  );
}
