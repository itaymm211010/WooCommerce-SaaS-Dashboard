
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
import { ArrowUpDown } from "lucide-react";
import { formatPrice } from "../utils/productUtils";
import { Product } from "@/types/database";
import { SortField, SortDirection } from "../hooks/useProducts";

interface ProductsTableProps {
  products: Product[] | undefined;
  sortField: SortField;
  sortProducts: (field: SortField) => void;
}

export const ProductsTable = ({ products, sortField, sortProducts }: ProductsTableProps) => {
  return (
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
        {!products || products.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No products found. Click the Sync button to import products from WooCommerce.
            </TableCell>
          </TableRow>
        ) : (
          products.map((product) => (
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
  );
};
