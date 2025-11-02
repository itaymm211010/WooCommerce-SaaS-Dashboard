
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OrdersHeaderProps {
  storeName?: string;
  isSyncing: boolean;
  onSyncOrders: () => void;
}

export function OrdersHeader({ 
  storeName, 
  isSyncing, 
  onSyncOrders,
}: OrdersHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link to="/stores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
            {storeName ? `${storeName} - Orders` : 'Orders'}
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Manage your store orders
          </p>
        </div>
        <Button 
          onClick={onSyncOrders}
          size="sm"
          className="gap-2"
          disabled={isSyncing}
        >
          <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Orders'}</span>
          <span className="sm:hidden">Sync</span>
        </Button>
      </div>
    </div>
  );
}
