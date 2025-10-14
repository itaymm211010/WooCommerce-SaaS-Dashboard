
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type Store = Tables<"stores">;
import { Badge } from "@/components/ui/badge";
import { getStatusColor } from "../utils/productUtils";
import { formatCurrency } from "../../../utils/currencyUtils";
import { Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ProductsTableProps {
  products: Product[];
  sortProducts: (field: string) => void;
  sortField: string;
  store: Store | undefined;
}

export function ProductsTable({
  products,
  sortProducts,
  sortField,
  store,
}: ProductsTableProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground mb-4">אין מוצרים זמינים</p>
        <Button asChild>
          <Link to={`/stores/${store?.id}/products/new/edit`} className="inline-flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            הוסף מוצר חדש
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link to={`/stores/${store?.id}/products/new/edit`} className="inline-flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            מוצר חדש
          </Link>
        </Button>
      </div>
      <Table className="min-w-full border rounded-lg overflow-hidden">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead
              className="cursor-pointer"
              onClick={() => sortProducts("name")}
            >
              שם מוצר
              {sortField === "name" && " 🔍"}
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => sortProducts("status")}
            >
              סטטוס
              {sortField === "status" && " 🔍"}
            </TableHead>
            <TableHead
              className="cursor-pointer text-right"
              onClick={() => sortProducts("price")}
            >
              מחיר
              {sortField === "price" && " 🔍"}
            </TableHead>
            <TableHead
              className="cursor-pointer text-right"
              onClick={() => sortProducts("stock_quantity")}
            >
              מלאי
              {sortField === "stock_quantity" && " 🔍"}
            </TableHead>
            <TableHead className="text-center">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(product.status)}>
                  {product.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(product.price || 0, store?.currency || "USD")}
              </TableCell>
              <TableCell className="text-right">
                {product.stock_quantity !== null ? product.stock_quantity : "לא מנוהל"}
              </TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" asChild>
                  <Link to={`/stores/${store?.id}/products/${product.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
