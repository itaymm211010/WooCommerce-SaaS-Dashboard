
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Store } from "@/types/database";
import { useProducts } from "./useProducts";

export const useProductSync = (store: Store | undefined, storeId: string | undefined) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const { refetch } = useProducts(storeId, 'name', 'asc', '');

  const hasValidStoreConfig = () => {
    if (!store) return false;
    
    return (
      !!store.url && 
      store.url.trim() !== '' && 
      !!store.api_key && 
      store.api_key.trim() !== '' && 
      !!store.api_secret && 
      store.api_secret.trim() !== ''
    );
  };

  const syncProducts = async () => {
    try {
      setIsSyncing(true);
      
      if (!hasValidStoreConfig()) {
        toast.error('Missing store configuration. Please check your store URL and API credentials.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-woo-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ store_id: storeId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to sync products: ${errorData.error || response.statusText}`);
      }

      toast.success('Successfully synced products');
      refetch();
    } catch (error) {
      console.error('Error syncing products:', error);
      if (error instanceof Error) {
        toast.error(`Failed to sync products: ${error.message}`);
      } else {
        toast.error('Failed to sync products: Unknown error occurred');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!autoSync) return;
    
    const interval = setInterval(() => {
      syncProducts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoSync, store]);

  return {
    isSyncing,
    autoSync,
    hasValidStoreConfig: hasValidStoreConfig(),
    syncProducts,
    toggleAutoSync: () => setAutoSync(!autoSync)
  };
};
