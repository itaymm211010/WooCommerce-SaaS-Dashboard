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
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function StoreProductsPage() {
  const { id } = useParams();
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  const { data: products, refetch } = useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      if (!id) throw new Error('No store ID provided');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', id);
      
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

  const syncProducts = async () => {
    try {
      setIsSyncing(true);
      
      if (!store?.url || !store?.api_key || !store?.api_secret) {
        toast.error('Missing store configuration. Please check your store URL and API credentials.');
        return;
      }

      const baseUrl = store.url.replace(/\/+$/, '');
      
      const response = await fetch(`${baseUrl}/wp-json/wc/v3/products?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('WooCommerce API Error:', errorText);
        throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
      }

      const wooProducts = await response.json();
      
      if (!Array.isArray(wooProducts)) {
        throw new Error('Invalid response from WooCommerce API');
      }
      
      const productsToInsert = wooProducts.map((product: any) => ({
        store_id: id,
        woo_id: product.id,
        name: product.name,
        price: product.price,
        stock_quantity: product.stock_quantity,
        status: product.status
      }));

      const { error } = await supabase
        .from('products')
        .upsert(productsToInsert, { onConflict: 'store_id,woo_id' });

      if (error) throw error;

      toast.success('Products synced successfully');
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
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No products found. Click the Sync button to import products from WooCommerce.
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.stock_quantity ?? "N/A"}</TableCell>
                  <TableCell>{product.status}</TableCell>
                  <TableCell>{new Date(product.updated_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Shell>
  );
}
