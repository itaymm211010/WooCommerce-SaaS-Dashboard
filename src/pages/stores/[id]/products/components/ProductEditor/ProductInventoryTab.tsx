
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Schema for validation
const inventorySchema = z.object({
  stock_quantity: z.coerce.number().int().min(0, { message: "כמות מלאי לא יכולה להיות שלילית" }),
  sku: z.string().optional(),
  weight: z.coerce.number().min(0, { message: "משקל לא יכול להיות שלילי" }).optional(),
  length: z.coerce.number().min(0, { message: "אורך לא יכול להיות שלילי" }).optional(),
  width: z.coerce.number().min(0, { message: "רוחב לא יכול להיות שלילי" }).optional(),
  height: z.coerce.number().min(0, { message: "גובה לא יכול להיות שלילי" }).optional(),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

interface ProductInventoryTabProps {
  initialData?: Partial<Product>;
  storeId: string;
}

export function ProductInventoryTab({ initialData, storeId }: ProductInventoryTabProps) {
  const [isSaving, setIsSaving] = React.useState(false);
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

  if (!initialData?.id) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>יש לשמור את המוצר תחילה</AlertTitle>
        <AlertDescription>
          לפני עדכון פרטי מלאי, יש לשמור את המוצר בלשונית "פרטים כלליים".
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="stock_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>כמות במלאי</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מק"ט</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4 mt-6">
          <h3 className="text-md font-medium mb-4">מידות ומשקל</h3>
          
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>משקל (קילוגרם)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אורך (ס"מ)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>רוחב (ס"מ)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>גובה (ס"מ)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="mt-4"
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "שומר..." : "עדכון פרטי מלאי"}
        </Button>
      </form>
    </Form>
  );
}
