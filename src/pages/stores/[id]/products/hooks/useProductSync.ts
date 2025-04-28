
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

      // Use the Supabase URL from the client configuration instead of environment variables
      const supabaseUrl = 'https://wzpbsridzmqrcztafzip.supabase.co';
      
      console.log(`Calling endpoint: ${supabaseUrl}/functions/v1/sync-woo-products`);
      
      // Get the anon key directly from the supabase client configuration
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData.session?.access_token;
      
      console.log('Authentication token available:', !!authToken);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/sync-woo-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ store_id: storeId })
      });

      if (!response.ok) {
        // Try to get error message from response if possible
        let errorMessage;
        try {
          const errorData = await response.text();
          // Only try to parse as JSON if it looks like JSON
          if (errorData.startsWith('{')) {
            const errorJson = JSON.parse(errorData);
            errorMessage = errorJson.error || response.statusText;
          } else {
            errorMessage = errorData || response.statusText;
          }
        } catch (parseError) {
          errorMessage = `Status ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(`Failed to sync products: ${errorMessage}`);
      }

      // Check if response has content before trying to parse JSON
      const text = await response.text();
      let data;
      
      if (text.trim() !== '') {
        try {
          data = JSON.parse(text);
          console.log('Response data:', data);
        } catch (jsonError) {
          console.error('Error parsing response as JSON:', jsonError, 'Response text:', text);
          throw new Error('Invalid response format from server');
        }
      } else {
        // Handle empty response
        console.warn('Empty response from server');
        data = {};
      }

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
