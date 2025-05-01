
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { toast } from "sonner";
import { productSchema, ProductFormData } from "../utils/productSchema";

interface UseProductFormProps {
  initialData?: Partial<Product>;
  storeId: string;
  isNewProduct: boolean;
}

export function useProductForm({ initialData, storeId, isNewProduct }: UseProductFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      short_description: initialData?.short_description || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      sale_price: initialData?.sale_price || 0,
      status: (initialData?.status as "publish" | "draft" | "pending" | "private") || "draft",
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsSaving(true);

      if (isNewProduct) {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert([
            {
              store_id: storeId,
              name: data.name,
              short_description: data.short_description,
              description: data.description,
              price: data.price,
              sale_price: data.sale_price || null,
              status: data.status,
              woo_id: 0, // Temporary ID until synced with WooCommerce
            },
          ])
          .select()
          .single();

        if (error) throw error;

        toast.success("המוצר נוצר בהצלחה");
        navigate(`/stores/${storeId}/products/${newProduct.id}/edit`);
      } else {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update({
            name: data.name,
            short_description: data.short_description,
            description: data.description,
            price: data.price,
            sale_price: data.sale_price || null,
            status: data.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialData?.id)
          .eq("store_id", storeId);

        if (error) throw error;

        toast.success("המוצר עודכן בהצלחה");
        queryClient.invalidateQueries({ queryKey: ['product', storeId, initialData?.id] });
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(`שגיאה בשמירת המוצר: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return { form, isSaving, onSubmit };
}
