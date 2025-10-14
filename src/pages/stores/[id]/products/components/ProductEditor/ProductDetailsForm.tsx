
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Save, RefreshCw } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
import { useProductForm } from "../../hooks/useProductForm";
import { TextField } from "./TextField";
import { PriceField } from "./PriceField";
import { StatusField } from "./StatusField";
import { Badge } from "@/components/ui/badge";

interface ProductDetailsFormProps {
  initialData?: Partial<Product>;
  storeId: string;
  isNewProduct: boolean;
}

export function ProductDetailsForm({ 
  initialData, 
  storeId, 
  isNewProduct 
}: ProductDetailsFormProps) {
  const { form, isSaving, onSubmit } = useProductForm({
    initialData,
    storeId,
    isNewProduct,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <TextField 
              name="name" 
              label="שם המוצר" 
              placeholder="הכנס שם מוצר" 
            />
          </div>
          {!isNewProduct && initialData?.woo_id && initialData.woo_id > 0 && (
            <Badge variant="outline" className="mr-2 bg-green-50">
              <RefreshCw className="w-3 h-3 mr-1" /> מסונכרן עם WooCommerce
            </Badge>
          )}
          {!isNewProduct && (!initialData?.woo_id || initialData.woo_id === 0) && (
            <Badge variant="outline" className="mr-2 bg-yellow-50">
              <RefreshCw className="w-3 h-3 mr-1" /> לא מסונכרן עם WooCommerce
            </Badge>
          )}
        </div>

        <TextField 
          name="short_description" 
          label="תיאור קצר" 
          placeholder="תיאור קצר למוצר" 
          multiline 
          rows={2} 
        />

        <TextField 
          name="description" 
          label="תיאור המוצר" 
          placeholder="תיאור מלא של המוצר" 
          multiline 
          rows={4} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PriceField 
            name="price" 
            label="מחיר רגיל"
          />

          <PriceField 
            name="sale_price" 
            label="מחיר מבצע" 
            placeholder="השאר ריק אם אין מבצע"
          />
        </div>

        <StatusField />

        <Button
          type="submit"
          className="mt-4"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              {isNewProduct ? "יוצר ומסנכרן..." : "מעדכן ומסנכרן..."}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isNewProduct ? "שמור ויצור ב-WooCommerce" : "עדכן ב-WooCommerce"}
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-2">
          שמירת המוצר תעדכן אותו גם בחנות WooCommerce שלך
        </p>
      </form>
    </Form>
  );
}
