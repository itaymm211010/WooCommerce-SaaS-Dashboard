import { Shell } from "@/components/layout/Shell";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpDown, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function StoreProductsPage() {
  const { id } = useParams();
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'price' | 'stock_quantity' | 'status' | 'updated_at'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  const { data: products, refetch } = useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      if (!id) throw new Error('No store ID provided');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', id)
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (error) throw error;
      console.log('Products data:', data);
      return data as Product[];
    },
    enabled: !!id
  });

  const { data: store } = useQuery({
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

  const getProductPrice = (product: any) => {
    if (product.type === 'variable' && product.variations && product.variations.length > 0) {
      const prices = product.variations.map((variation: any) => {
        return parseFloat(variation.regular_price || variation.price || 0);
      }).filter((price: number) => price > 0);

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        return minPrice;
      }
      return 0;
    }

    if (product.regular_price) {
      return parseFloat(product.regular_price);
    }

    if (product.price) {
      return parseFloat(product.price);
    }

    return 0;
  };

  const formatPrice = (price: number | null, productType: string) => {
    if (price === 0 || price === null) {
      return productType === 'variable' ? 'Variable Product' : 'N/A';
    }
    return `$${price}`;
  };

  const sortProducts = (field: typeof sortField) => {
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

  const syncProducts = async () => {
    try {
      setIsSyncing(true);
      
      if (!store?.url || !store?.api_key || !store?.api_secret) {
        toast.error('Missing store configuration. Please check your store URL and API credentials.');
        return;
      }

      let baseUrl = store.url.replace(/\/+$/, '');
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      
      const response = await fetch(`${baseUrl}/wp-json/wc/v3/products?per_page=100&consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WooCommerce API Error:', errorText);
        
        if (response.status === 0) {
          throw new Error('CORS error - Please make sure your WooCommerce site allows external connections');
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
              `${baseUrl}/wp-json/wc/v3/products/${product.id}/variations?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
              {
                headers: {
                  'Content-Type': 'application/json'
                }
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
              disabled={isSyncing}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isSyncing && "animate-spin"
              )} />
              {isSyncing ? 'Syncing...' : 'Sync Products'}
            </Button>
          </div>
        </div>

        <Table>
          <TableCaption>A list of your store products.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortProducts('name')}
                  className="flex items-center gap-2"
                >
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortProducts('price')}
                  className="flex items-center gap-2"
                >
                  Price
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortProducts('stock_quantity')}
                  className="flex items-center gap-2"
                >
                  Stock
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortProducts('status')}
                  className="flex items-center gap-2"
                >
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => sortProducts('updated_at')}
                  className="flex items-center gap-2"
                >
                  Last Updated
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No products found. Click the Sync button to import products from WooCommerce.
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{formatPrice(product.price, product.type || 'simple')}</TableCell>
                  <TableCell>{product.stock_quantity ?? "N/A"}</TableCell>
                  <TableCell>{product.status}</TableCell>
                  <TableCell>{new Date(product.updated_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")} 
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink 
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={cn("cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </Shell>
  );
}
