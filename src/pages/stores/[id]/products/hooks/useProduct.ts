
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { toast } from "sonner";

export const useProduct = (storeId: string | undefined, productId: string | undefined) => {
  return useQuery({
    queryKey: ['product', storeId, productId],
    queryFn: async () => {
      if (!storeId || !productId || productId === "new") {
        // Return empty product for new product
        if (productId === "new") {
          return {
            name: "",
            description: "",
            price: 0,
            status: "draft",
            stock_quantity: 0,
            sku: "",
          } as Partial<Product>;
        }
        throw new Error("חסרים פרטי חנות או מוצר");
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('id', productId)
        .single();
      
      if (error) {
        console.error('Error fetching product:', error);
        toast.error(`שגיאה בטעינת המוצר: ${error.message}`);
        throw error;
      }

      return data as Product;
    },
    enabled: !!storeId && !!productId && productId !== "new"
  });
};
