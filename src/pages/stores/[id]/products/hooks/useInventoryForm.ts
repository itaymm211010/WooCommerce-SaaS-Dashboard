
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
import { toast } from "sonner";
import { inventorySchema, InventoryFormData } from "../utils/inventorySchema";

interface UseInventoryFormProps {
  initialData?: Partial<Product>;
  storeId: string;
  productId: string;
}

export function useInventoryForm({ initialData, storeId, productId }: UseInventoryFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingToWoo, setSyncingToWoo] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      sku: initialData?.sku || "",
      stock_quantity: initialData?.stock_quantity || null,
      weight: initialData?.weight || null,
      length: initialData?.length || null,
      width: initialData?.width || null,
      height: initialData?.height || null,
    },
  });

  const onSubmit = async (data: InventoryFormData) => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("products")
        .update({
          sku: data.sku || null,
          stock_quantity: data.stock_quantity,
          weight: data.weight,
          length: data.length,
          width: data.width,
          height: data.height,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("store_id", storeId);

      if (error) throw error;

      toast.success("פרטי המלאי עודכנו בהצלחה");
      queryClient.invalidateQueries({ queryKey: ['product', storeId, productId] });
      
      // After saving locally, sync to WooCommerce
      await syncInventoryToWooCommerce({
        ...initialData,
        ...data,
        id: productId,
        store_id: storeId
      });
      
    } catch (error: any) {
      console.error("Error saving inventory details:", error);
      toast.error(`שגיאה בשמירת פרטי המלאי: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const syncInventoryToWooCommerce = async (product: Partial<Product>) => {
    try {
      // If product doesn't have a WooCommerce ID, we can't update it
      if (!product.woo_id || product.woo_id === 0) {
        console.log('מוצר זה עדיין לא קיים ב-WooCommerce, יש לשמור תחילה את פרטי המוצר הבסיסיים');
        return;
      }
      
      setSyncingToWoo(true);
      
      // Use the supabase URL from the client configuration
      const supabaseUrl = 'https://wzpbsridzmqrcztafzip.supabase.co';
      
      // Get the auth token
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData.session?.access_token;
      
      if (!authToken) {
        throw new Error('לא מחובר למערכת');
      }
      
      console.log('מסנכרן פרטי מלאי ל-WooCommerce:', product.id);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/update-woo-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          product, 
          store_id: storeId 
        })
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || response.statusText;
        } catch {
          errorMessage = `Status ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(`נכשל סנכרון ל-WooCommerce: ${errorMessage}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success("פרטי המלאי סונכרנו בהצלחה עם WooCommerce");
      }
    } catch (error: any) {
      console.error("Error syncing inventory to WooCommerce:", error);
      toast.error(`שגיאה בסנכרון פרטי המלאי ל-WooCommerce: ${error.message}`);
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
