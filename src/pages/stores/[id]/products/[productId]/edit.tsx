
import React from 'react';
import { useParams } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProduct } from "../hooks/useProduct";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "lucide-react";
import { ProductDetailsForm } from "../components/ProductEditor/ProductDetailsForm";
import { ProductImagesTab } from "../components/ProductEditor/ProductImagesTab";
import { ProductInventoryTab } from "../components/ProductEditor/ProductInventoryTab";
import { ProductVariationsTab } from "../components/ProductEditor/ProductVariationsTab";
import { ProductCategoriesTab } from "../components/ProductEditor/ProductCategoriesTab";
import { ProductAttributesTab } from "../components/ProductEditor/ProductAttributesTab";
import { SyncToWooButton } from "../components/ProductEditor/SyncToWooButton";
import { supabase } from "@/integrations/supabase/client";

export default function ProductEditorPage() {
  const { id: storeId, productId } = useParams();
  const { data: product, isLoading, error, refetch } = useProduct(storeId, productId);

  // Check for "new" product case
  const isNewProduct = productId === "new";

  if (isLoading) {
    return (
      <Shell>
        <div className="flex justify-center items-center h-64">
          <Loader className="h-6 w-6 animate-spin" />
          <span className="ms-2">טוען פרטי מוצר...</span>
        </div>
      </Shell>
    );
  }

  if (error && !isNewProduct) {
    return (
      <Shell>
        <div className="text-destructive">
          <p>שגיאה בטעינת המוצר: {error.message}</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 w-full max-w-full">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNewProduct ? "מוצר חדש" : `עריכת מוצר: ${product?.name || ""}`}
            </h1>
            <p className="text-muted-foreground">
              {isNewProduct
                ? "יצירת מוצר חדש בחנות"
                : "עריכת פרטי המוצר וסנכרון עם ווקומרס"}
            </p>
          </div>
          {!isNewProduct && (
            <SyncToWooButton 
              storeId={storeId || ""} 
              productId={productId || ""}
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isNewProduct ? "פרטי מוצר חדש" : "פרטי מוצר"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="details">פרטים כלליים</TabsTrigger>
                <TabsTrigger value="images">תמונות</TabsTrigger>
                <TabsTrigger value="inventory">מלאי</TabsTrigger>
                {!isNewProduct && (
                  <>
                    <TabsTrigger value="attributes">תכונות</TabsTrigger>
                    <TabsTrigger value="variations">וריאציות</TabsTrigger>
                    <TabsTrigger value="categories">קטגוריות ותגים</TabsTrigger>
                  </>
                )}
                <TabsTrigger value="custom-fields" disabled>
                  שדות מותאמים
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <ProductDetailsForm 
                  initialData={product} 
                  storeId={storeId || ""} 
                  isNewProduct={isNewProduct}
                />
              </TabsContent>

              <TabsContent value="images">
                <ProductImagesTab 
                  storeId={storeId || ""} 
                  productId={isNewProduct ? "" : (productId || "")}
                />
              </TabsContent>

              <TabsContent value="inventory">
                <ProductInventoryTab 
                  initialData={product}
                  storeId={storeId || ""}
                  productId={productId || ""}
                />
              </TabsContent>

              {!isNewProduct && (
                <TabsContent value="attributes">
                  <ProductAttributesTab 
                    storeId={storeId || ""} 
                    productId={productId || ""}
                  />
                </TabsContent>
              )}

              {!isNewProduct && (
                <TabsContent value="variations">
                  <ProductVariationsTab 
                    storeId={storeId || ""} 
                    productId={productId || ""}
                  />
                </TabsContent>
              )}

              {!isNewProduct && (
                <TabsContent value="categories">
                  <ProductCategoriesTab
                    categories={(product?.categories as any) || []}
                    tags={(product?.tags as any) || []}
                    brands={(product?.brands as any) || []}
                    onCategoriesChange={(categories) => {
                      supabase
                        .from('products')
                        .update({ categories: categories as any })
                        .eq('id', productId)
                        .then(() => refetch());
                    }}
                    onTagsChange={(tags) => {
                      supabase
                        .from('products')
                        .update({ tags: tags as any })
                        .eq('id', productId)
                        .then(() => refetch());
                    }}
                    onBrandsChange={(brands) => {
                      supabase
                        .from('products')
                        .update({ brands: brands as any })
                        .eq('id', productId)
                        .then(() => refetch());
                    }}
                  />
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
