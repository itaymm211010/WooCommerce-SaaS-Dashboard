
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Product } from "@/types/database";
import { useProductForm } from "../../hooks/useProductForm";
import { TextField } from "./TextField";
import { PriceField } from "./PriceField";
import { StatusField } from "./StatusField";

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
        <TextField 
          name="name" 
          label="שם המוצר" 
          placeholder="הכנס שם מוצר" 
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
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "שומר..." : "שמור מוצר"}
        </Button>
      </form>
    </Form>
  );
}
