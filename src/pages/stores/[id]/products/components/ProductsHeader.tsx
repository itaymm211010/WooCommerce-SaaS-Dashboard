
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Store } from "@/types/database";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProductsHeaderProps {
  store: Store | undefined;
  isSyncing: boolean;
  autoSync: boolean;
  hasValidStoreConfig: boolean;
  onAutoSyncToggle: () => void;
  onSyncProducts: () => void;
}

export const ProductsHeader = ({
  store,
  isSyncing,
  autoSync,
  hasValidStoreConfig,
  onAutoSyncToggle,
  onSyncProducts
}: ProductsHeaderProps) => {
  return (
    <>
      <div className="flex items-center gap-4">
        <Link to="/stores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {store?.name ? `${store.name} - Products` : 'Products'}
          </h1>
          <p className="text-muted-foreground">
            Manage your store products
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onAutoSyncToggle}
            className={cn(
              "gap-2",
              autoSync && "bg-accent"
            )}
          >
            Auto Sync {autoSync ? 'ON' : 'OFF'}
          </Button>
          <Button 
            onClick={onSyncProducts} 
            className="gap-2" 
            disabled={isSyncing || !hasValidStoreConfig}
            title={!hasValidStoreConfig ? "Missing store configuration" : ""}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isSyncing && "animate-spin"
            )} />
            {isSyncing ? 'Syncing...' : 'Sync Products'}
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
