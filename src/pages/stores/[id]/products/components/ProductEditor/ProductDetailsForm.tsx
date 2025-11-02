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
  const {
    form,
    isSaving,
    onSubmit
  } = useProductForm({
    initialData,
    storeId,
    isNewProduct
  });
  const [productType, setProductType] = useState(initialData?.type || "simple");
  const isVariableProduct = productType === "variable";
  return <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header with badges */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {isVariableProduct ? <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 text-xs">
                <Layers className="w-3 h-3 mr-1" /> מוצר עם וריאציות
              </Badge> : <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 text-xs">
                <Package className="w-3 h-3 mr-1" /> מוצר רגיל
              </Badge>}
            
            {!isNewProduct && initialData?.woo_id && initialData.woo_id > 0 && <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> מסונכרן
              </Badge>}
            {!isNewProduct && (!initialData?.woo_id || initialData.woo_id === 0) && <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> לא מסונכרן
              </Badge>}
          </div>
        </div>
        
        {/* Section Headers with Icons */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold">תיאור המוצר</h3>
        </div>

        <TextField name="name" label="שם המוצר" placeholder="הכנס שם מוצר" />

        <ProductTypeField productId={initialData?.id} storeId={storeId} isNewProduct={isNewProduct} onTypeChange={setProductType} />

        <TextField name="short_description" label="תיאור קצר" placeholder="תיאור קצר למוצר" multiline rows={2} />

        <TextField name="description" label="תיאור המוצר" placeholder="תיאור מלא של המוצר" multiline rows={4} />

        {/* Price Section */}
        <div className="flex items-center gap-3 mt-6 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 my-0 py-[2px] px-[8px]">
            <span className="text-white font-bold text-2xl text-justify">₪</span>
          </div>
          <h3 className="text-lg font-semibold">מחירי המוצר</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PriceField name="price" label="מחיר רגיל" disabled={isVariableProduct} helpText={isVariableProduct ? "מחירים של מוצרים עם וריאציות מנוהלים בלשונית 'וריאציות'" : undefined} />

          <PriceField name="sale_price" label="מחיר מבצע" placeholder="השאר ריק אם אין מבצע" disabled={isVariableProduct} helpText={isVariableProduct ? "מחירי מבצע של וריאציות מנוהלים בלשונית 'וריאציות'" : undefined} />
        </div>

        <StatusField />

        <Button type="submit" className="mt-4 w-full sm:w-auto" size="sm" disabled={isSaving}>
          {isSaving ? <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              <span className="hidden sm:inline">{isNewProduct ? "יוצר ומסנכרן..." : "מעדכן ומסנכרן..."}</span>
              <span className="sm:hidden">{isNewProduct ? "שומר..." : "מעדכן..."}</span>
            </> : <>
              <Save className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{isNewProduct ? "שמור ויצור ב-WooCommerce" : "עדכן ב-WooCommerce"}</span>
              <span className="sm:hidden">{isNewProduct ? "שמור" : "עדכן"}</span>
            </>}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-2">
          שמירת המוצר תעדכן אותו גם בחנות WooCommerce שלך
        </p>
      </form>
    </Form>;
}