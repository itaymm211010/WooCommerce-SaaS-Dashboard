
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

// Schema for validation
const productSchema = z.object({
  name: z.string().min(1, { message: "נדרש שם מוצר" }),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, { message: "מחיר לא יכול להיות שלילי" }),
  sale_price: z.coerce.number().min(0, { message: "מחיר מבצע לא יכול להיות שלילי" }).optional(),
  status: z.enum(["publish", "draft", "pending", "private"], {
    required_error: "נדרש סטטוס מוצר",
  }),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductDetailsFormProps {
  initialData?: Partial<Product>;
  storeId: string;
  isNewProduct: boolean;
}

export function ProductDetailsForm({ initialData, storeId, isNewProduct }: ProductDetailsFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>שם המוצר</FormLabel>
              <FormControl>
                <Input {...field} placeholder="הכנס שם מוצר" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תיאור קצר</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="תיאור קצר למוצר"
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תיאור המוצר</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="תיאור מלא של המוצר"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מחיר רגיל</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">₪</span>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      className="pl-8"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sale_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מחיר מבצע</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">₪</span>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      className="pl-8"
                      placeholder="השאר ריק אם אין מבצע"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>סטטוס מוצר</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="publish">מפורסם</SelectItem>
                  <SelectItem value="draft">טיוטה</SelectItem>
                  <SelectItem value="pending">ממתין לאישור</SelectItem>
                  <SelectItem value="private">פרטי</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="mt-4"
          disabled={isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "שומר..." : "שמור מוצר"}
        </Button>
      </form>
    </Form>
  );
}
