
import { Shell } from "@/components/layout/Shell";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ProductsTable } from "./components/ProductsTable";
import { ProductsPagination } from "./components/ProductsPagination";
import { useProducts, SortField, SortDirection } from "./hooks/useProducts";
import { getProductPrice } from "./utils/productUtils";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StoreProductsPage() {
  const { id } = useParams();
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const { data: products, refetch } = useProducts(id, sortField, sortDirection, searchQuery);

  const { data: store, isLoading: isStoreLoading } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      if (!id) throw new Error('No store ID provided');
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const sortProducts = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = products ? Math.ceil(products.length / itemsPerPage) : 0;
  const paginatedProducts = products?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Check if store has valid configuration
  const hasValidStoreConfig = () => {
    if (!store) return false;
    
    // Check if store URL, API key, and API secret are present and not empty strings
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

      // Call our Edge Function instead of directly accessing the WooCommerce API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-woo-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ store_id: id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to sync products: ${errorData.error || response.statusText}`);
      }

      const { products: wooProducts } = await response.json();
      
      if (!Array.isArray(wooProducts)) {
        throw new Error('Invalid response from WooCommerce API');
      }
      
      console.log(`Fetched ${wooProducts.length} products from WooCommerce`);
      
      const productsToInsert = wooProducts
        .filter(product => product)
        .map((product: any) => ({
          store_id: id,
          woo_id: product.id,
          name: product.name,
          price: getProductPrice(product),
          stock_quantity: product.stock_quantity,
          status: product.status,
          type: product.type
        }));

      console.log('Products to insert:', productsToInsert);

      if (productsToInsert.length === 0) {
        toast.info('No products found to sync');
        return;
      }

      const { error } = await supabase
        .from('products')
        .upsert(productsToInsert, { onConflict: 'store_id,woo_id' });

      if (error) throw error;

      toast.success(`Successfully synced ${productsToInsert.length} products`);
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

  return (
    <Shell>
      <div className="space-y-8">
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
              onClick={() => setAutoSync(!autoSync)}
              className={cn(
                "gap-2",
                autoSync && "bg-accent"
              )}
            >
              Auto Sync {autoSync ? 'ON' : 'OFF'}
            </Button>
            <Button 
              onClick={syncProducts} 
              className="gap-2" 
              disabled={isSyncing || isStoreLoading || !hasValidStoreConfig()}
              title={!hasValidStoreConfig() ? "Missing store configuration" : ""}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isSyncing && "animate-spin"
              )} />
              {isSyncing ? 'Syncing...' : 'Sync Products'}
            </Button>
          </div>
        </div>

        {!hasValidStoreConfig() && (
          <Alert variant="destructive">
            <AlertTitle>Missing store configuration</AlertTitle>
            <AlertDescription>
              Please check your store URL, API key, and API secret in the store settings. 
              Without this information, products cannot be synchronized.
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <ProductsTable 
          products={paginatedProducts}
          sortField={sortField}
          sortProducts={sortProducts}
        />

        <ProductsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </Shell>
  );
}
