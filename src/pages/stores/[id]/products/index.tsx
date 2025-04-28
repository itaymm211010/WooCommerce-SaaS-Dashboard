
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

      let baseUrl = store!.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      
      console.log('Attempting to fetch products from WooCommerce API with URL:', baseUrl);
      
      const response = await fetch(`${baseUrl}/wp-json/wc/v3/products?per_page=100&consumer_key=${store!.api_key}&consumer_secret=${store!.api_secret}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WooCommerce API Error:', errorText);
        
        if (response.status === 0) {
          throw new Error(`CORS error - Please make sure your WooCommerce site allows external connections. Add the following to your wp-config.php:\n\nheader("Access-Control-Allow-Origin: *");\nheader("Access-Control-Allow-Methods: GET,HEAD,OPTIONS,POST,PUT");\nheader("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");`);
        }
        
        if (response.status === 401) {
          throw new Error('Authentication failed - Please check your API credentials');
        }
        
        if (response.status === 404) {
          throw new Error('Store not found - Please check your store URL');
        }
        
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }

      const wooProducts = await response.json();
      
      if (!Array.isArray(wooProducts)) {
        throw new Error('Invalid response from WooCommerce API');
      }
      
      console.log(`Fetched ${wooProducts.length} products from WooCommerce`);
      
      const productsWithVariations = await Promise.all(wooProducts.map(async (product) => {
        if (product.type === 'variable') {
          try {
            const variationsResponse = await fetch(
              `${baseUrl}/wp-json/wc/v3/products/${product.id}/variations?consumer_key=${store!.api_key}&consumer_secret=${store!.api_secret}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                mode: 'cors'
              }
            );
            
            if (variationsResponse.ok) {
              const variations = await variationsResponse.json();
              return { ...product, variations };
            }
          } catch (error) {
            console.error(`Failed to fetch variations for product ${product.id}:`, error);
          }
        }
        return product;
      }));
      
      const productsToInsert = productsWithVariations
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
          <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Missing store configuration</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Please check your store URL, API key, and API secret in the store settings. 
                    Without this information, products cannot be synchronized.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
