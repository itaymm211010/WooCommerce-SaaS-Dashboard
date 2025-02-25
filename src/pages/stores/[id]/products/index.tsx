
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

export default function StoreProductsPage() {
  const { id } = useParams();

  const { data: products, refetch } = useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      if (!id) throw new Error('No store ID provided');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', id);
      
      if (error) throw error;
      console.log('Products data:', data); // Debug log
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
      // טוען את המוצרים מה-API של WooCommerce
      const response = await fetch(`${store?.url}/wp-json/wc/v3/products`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${store?.api_key}:${store?.api_secret}`)
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products from WooCommerce');
      }

      const wooProducts = await response.json();
      
      // ממיר את המוצרים לפורמט של הדאטאבייס שלנו
      const productsToInsert = wooProducts.map((product: any) => ({
        store_id: id,
        woo_id: product.id,
        name: product.name,
        price: product.price,
        stock_quantity: product.stock_quantity,
        status: product.status
      }));

      // מוסיף את המוצרים לדאטאבייס
      const { error } = await supabase
        .from('products')
        .upsert(productsToInsert, { onConflict: 'store_id,woo_id' });

      if (error) throw error;

      toast.success('Products synced successfully');
      refetch(); // מרענן את הטבלה
    } catch (error) {
      console.error('Error syncing products:', error);
      toast.error('Failed to sync products');
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your store products
            </p>
          </div>
          <Button onClick={syncProducts} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Products
          </Button>
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
