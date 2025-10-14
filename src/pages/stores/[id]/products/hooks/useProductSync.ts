
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;
import { useProducts } from "./useProducts";

export const useProductSync = (store: Store | undefined, storeId: string | undefined) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const { refetch } = useProducts(storeId, 'name', 'asc', '');

  const hasValidStoreConfig = () => {
    if (!store) return false;
    
    return Boolean(
      store.url && 
      store.url.trim() !== '' && 
      store.api_key && 
      store.api_key.trim() !== '' && 
      store.api_secret && 
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

      console.log('Calling sync-woo-products function...');
      
      const { data, error } = await supabase.functions.invoke('sync-woo-products', {
        body: { store_id: storeId }
      });

      if (error) {
        throw error;
      }

      console.log('Response data:', data);

      const productCount = data?.products?.length || 0;
      console.log(`Synced ${productCount} products. Checking if they were saved to the database...`);
      
      // Verify products were saved by checking the database
      const { data: savedProducts, error: fetchError } = await supabase
        .from('products')
        .select('count')
        .eq('store_id', storeId);
      
      if (fetchError) {
        console.error('Error verifying saved products:', fetchError);
      } else {
        console.log('Products in database:', savedProducts);
      }
      
      toast.success(`Successfully synced ${productCount} products`);
      
      // Force refetch products to update the UI
      await refetch();
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
