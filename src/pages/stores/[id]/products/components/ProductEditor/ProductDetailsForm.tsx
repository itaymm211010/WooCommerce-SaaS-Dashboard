
import React, { useState } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Save, RefreshCw, Package, Layers } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
import { useProductForm } from "../../hooks/useProductForm";
import { TextField } from "./TextField";
import { PriceField } from "./PriceField";
import { StatusField } from "./StatusField";
import { Badge } from "@/components/ui/badge";
import { ProductTypeField } from "./ProductTypeField";

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

  const [productType, setProductType] = useState(initialData?.type || "simple");
  const isVariableProduct = productType === "variable";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header with badges */}
        <div className="flex justify-between items-center gap-4 mb-4">
          <div className="flex gap-2">
            {isVariableProduct ? (
              <Badge className="bg-orange-500 hover:bg-orange-600">
                <Layers className="w-3 h-3 mr-1" /> מוצר עם וריאציות
              </Badge>
            ) : (
              <Badge className="bg-blue-500 hover:bg-blue-600">
                <Package className="w-3 h-3 mr-1" /> מוצר רגיל
              </Badge>
            )}
            
            {!isNewProduct && initialData?.woo_id && initialData.woo_id > 0 && (
              <Badge variant="outline" className="bg-green-50">
                <RefreshCw className="w-3 h-3 mr-1" /> מסונכרן עם WooCommerce
              </Badge>
            )}
            {!isNewProduct && (!initialData?.woo_id || initialData.woo_id === 0) && (
              <Badge variant="outline" className="bg-yellow-50">
                <RefreshCw className="w-3 h-3 mr-1" /> לא מסונכרן עם WooCommerce
              </Badge>
            )}
          </div>
        </div>

        <TextField 
          name="name" 
          label="שם המוצר" 
          placeholder="הכנס שם מוצר" 
        />

        <ProductTypeField 
          productId={initialData?.id}
          storeId={storeId}
          isNewProduct={isNewProduct}
          onTypeChange={setProductType}
        />

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
            disabled={isVariableProduct}
            helpText={isVariableProduct ? "מחירים של מוצרים עם וריאציות מנוהלים בלשונית 'וריאציות'" : undefined}
          />

          <PriceField 
            name="sale_price" 
            label="מחיר מבצע" 
            placeholder="השאר ריק אם אין מבצע"
            disabled={isVariableProduct}
            helpText={isVariableProduct ? "מחירי מבצע של וריאציות מנוהלים בלשונית 'וריאציות'" : undefined}
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
