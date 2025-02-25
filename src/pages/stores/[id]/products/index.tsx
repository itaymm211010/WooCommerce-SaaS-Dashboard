
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
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function StoreProductsPage() {
  const { id } = useParams();

  const { data: products } = useQuery({
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

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your store products
            </p>
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
                  No products found
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
