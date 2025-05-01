
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { toast } from "sonner";
import { inventorySchema, InventoryFormData } from "../utils/inventorySchema";

interface UseInventoryFormProps {
  initialData?: Partial<Product>;
  storeId: string;
}

export function useInventoryForm({ initialData, storeId }: UseInventoryFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      stock_quantity: initialData?.stock_quantity || 0,
      sku: initialData?.sku || "",
      weight: initialData?.weight || 0,
      length: initialData?.length || 0,
      width: initialData?.width || 0,
      height: initialData?.height || 0,
    },
  });

  const onSubmit = async (data: InventoryFormData) => {
    if (!initialData?.id) {
      toast.error("יש לשמור את המוצר תחילה לפני עדכון פרטי מלאי");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("products")
        .update({
          stock_quantity: data.stock_quantity,
          sku: data.sku,
          weight: data.weight,
          length: data.length,
          width: data.width,
          height: data.height,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialData.id)
        .eq("store_id", storeId);

      if (error) throw error;

      toast.success("פרטי המלאי עודכנו בהצלחה");
      queryClient.invalidateQueries({ queryKey: ['product', storeId, initialData.id] });
    } catch (error: any) {
      console.error("Error saving inventory data:", error);
      toast.error(`שגיאה בשמירת פרטי מלאי: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return { form, isSaving, onSubmit };
}
