
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { productSchema, ProductFormData } from "../utils/productSchema";

type Product = Tables<"products">;

interface UseProductFormProps {
  initialData?: Partial<Product>;
  storeId: string;
  isNewProduct: boolean;
}

export function useProductForm({ initialData, storeId, isNewProduct }: UseProductFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingToWoo, setSyncingToWoo] = useState(false);
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

      let productId: string;
      let productData: Partial<Product> = {
        name: data.name,
        short_description: data.short_description,
        description: data.description,
        price: data.price,
        sale_price: data.sale_price || null,
        status: data.status,
        updated_at: new Date().toISOString(),
      };

      if (isNewProduct) {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert({
            store_id: storeId,
            name: productData.name!,
            short_description: productData.short_description,
            description: productData.description,
            price: productData.price,
            sale_price: productData.sale_price,
            status: productData.status!,
            woo_id: 0,
          })
          .select()
          .single();

        if (error) throw error;
        productId = newProduct.id;
        
        toast.success("המוצר נוצר בהצלחה");
        
        // Navigate to edit page for the new product
        navigate(`/stores/${storeId}/products/${productId}/edit`);
      } else {
        // Update existing product
        productId = initialData?.id as string;
        
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId)
          .eq("store_id", storeId);

        if (error) throw error;
        
        toast.success("המוצר עודכן בהצלחה");
        queryClient.invalidateQueries({ queryKey: ['product', storeId, productId] });
      }

      // After saving locally, sync to WooCommerce
      await syncToWooCommerce({
        ...initialData,
        ...productData,
        id: productId,
        woo_id: initialData?.woo_id || 0,
        store_id: storeId
      });
      
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(`שגיאה בשמירת המוצר: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const syncToWooCommerce = async (product: Partial<Product>) => {
    try {
      setSyncingToWoo(true);
      
      console.log('מסנכרן מוצר ל-WooCommerce:', product.id);
      
      const { data, error } = await supabase.functions.invoke('update-woo-product', {
        body: { 
          product, 
          store_id: storeId 
        }
      });

      if (error) {
        throw error;
      }
      
      if (data?.success) {
        toast.success("המוצר סונכרן בהצלחה עם WooCommerce");
        
        // If this was a new product, update the woo_id in our database
        if (product.woo_id === 0 && data.woo_id) {
          const { error } = await supabase
            .from("products")
            .update({ woo_id: data.woo_id })
            .eq("id", product.id);
            
          if (error) {
            console.error("Error updating product with new WooCommerce ID:", error);
          } else {
            // Invalidate the product query to refresh the data
            queryClient.invalidateQueries({ queryKey: ['product', storeId, product.id] });
          }
        }
      }
    } catch (error: any) {
      console.error("Error syncing to WooCommerce:", error);
      toast.error(`שגיאה בסנכרון ל-WooCommerce: ${error.message}`);
    } finally {
      setSyncingToWoo(false);
    }
  };

  return { 
    form, 
    isSaving: isSaving || isSyncingToWoo, 
    onSubmit 
  };
}
