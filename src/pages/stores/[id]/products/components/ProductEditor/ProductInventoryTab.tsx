
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Product } from "@/types/database";
import { useInventoryForm } from "../../hooks/useInventoryForm";
import { InventoryBasicFields } from "./InventoryBasicFields";
import { InventoryDimensionsFields } from "./InventoryDimensionsFields";
import { ProductNotSavedAlert } from "./ProductNotSavedAlert";

interface ProductInventoryTabProps {
  initialData?: Partial<Product>;
  storeId: string;
  productId?: string;
}

export function ProductInventoryTab({ initialData, storeId, productId }: ProductInventoryTabProps) {
  const { form, isSaving, onSubmit } = useInventoryForm({ 
    initialData, 
    storeId,
    productId: productId || (initialData?.id || "")
  });

  if (!initialData?.id) {
    return <ProductNotSavedAlert />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <InventoryBasicFields />

        <div className="border-t pt-4 mt-6">
          <h3 className="text-md font-medium mb-4">מידות ומשקל</h3>
          <InventoryDimensionsFields />
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
