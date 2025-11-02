import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { getStatusColor } from "../utils/productUtils";
import { formatCurrency } from "../../../utils/currencyUtils";

type Product = Tables<"products">;
type Store = Tables<"stores">;

interface MobileProductCardProps {
  product: Product;
  store: Store | undefined;
}

export function MobileProductCard({ product, store }: MobileProductCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {product.type === 'variable' ? 'משתנה' : 'פשוט'}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getStatusColor(product.status)}`}>
                  {product.status}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/stores/${store?.id}/products/${product.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">מחיר</p>
              <p className="text-lg font-semibold">
                {formatCurrency(product.price || 0, store?.currency || "USD")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">מלאי</p>
              <p className="text-lg font-semibold">
                {product.stock_quantity !== null ? product.stock_quantity : "לא מנוהל"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
