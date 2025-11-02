
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Package, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProductsHeaderProps {
  store: Store | undefined;
  isSyncing: boolean;
  autoSync: boolean;
  hasValidStoreConfig: boolean;
  onAutoSyncToggle: () => void;
  onSyncProducts: () => void;
  isBulkSyncing?: boolean;
  onBulkSyncToWoo?: () => void;
}

export const ProductsHeader = ({
  store,
  isSyncing,
  autoSync,
  hasValidStoreConfig,
  onAutoSyncToggle,
  onSyncProducts,
  isBulkSyncing,
  onBulkSyncToWoo
}: ProductsHeaderProps) => {
  return (
    <>
      <div className="space-y-4">
        {/* Header Row */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
              {store?.name ? `${store.name} - Products` : 'Products'}
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Manage your store products and inventory
            </p>
          </div>
        </div>
        
        {/* Action Buttons - Responsive Grid */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onAutoSyncToggle}
            size="sm"
            className={cn("gap-2", autoSync && "bg-accent")}
          >
            <span className="hidden sm:inline">Auto Sync</span>
            <span className="sm:hidden">Auto</span>
            {autoSync ? 'ON' : 'OFF'}
          </Button>
          
          <Button 
            onClick={onSyncProducts}
            size="sm"
            className="gap-2 flex-1 sm:flex-initial"
            disabled={isSyncing || !hasValidStoreConfig}
            title={!hasValidStoreConfig ? "Missing store configuration" : ""}
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
            <span className="hidden sm:inline">
              {isSyncing ? 'Syncing...' : 'Sync from WooCommerce'}
            </span>
            <span className="sm:hidden">Sync</span>
          </Button>
          
          {onBulkSyncToWoo && (
            <Button 
              onClick={onBulkSyncToWoo} 
              variant="outline"
              size="sm"
              className="gap-2 hidden md:flex"
              disabled={isBulkSyncing || !hasValidStoreConfig}
              title={!hasValidStoreConfig ? "Missing store configuration" : ""}
            >
              <Upload className={cn("h-4 w-4", isBulkSyncing && "animate-spin")} />
              {isBulkSyncing ? 'Syncing to WooCommerce...' : 'Sync All to WooCommerce'}
            </Button>
          )}
          
          <Button 
            variant="outline"
            size="sm"
            className="gap-2"
            asChild
          >
            <Link to={`/stores/${store?.id}/products/new/edit`}>
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">New Product</span>
              <span className="sm:hidden">New</span>
            </Link>
          </Button>
        </div>
      </div>

      {!hasValidStoreConfig && store && (
        <Alert variant="destructive">
          <AlertTitle>Missing store configuration</AlertTitle>
          <AlertDescription>
            Please check your store URL, API key, and API secret in the store settings. 
            Without this information, products cannot be synchronized.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
