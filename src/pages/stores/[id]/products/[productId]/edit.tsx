
import React from 'react';
import { useParams } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProduct } from "../hooks/useProduct";
import { useStoreTaxonomies } from "../hooks/useStoreTaxonomies";
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
import { toast } from "sonner";

export default function ProductEditorPage() {
  const { id: storeId, productId } = useParams();
  const { data: product, isLoading, error, refetch } = useProduct(storeId, productId);
  const { data: taxonomies, isLoading: taxonomiesLoading } = useStoreTaxonomies(storeId);

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
                    availableCategories={taxonomies?.categories || []}
                    availableTags={taxonomies?.tags || []}
                    availableBrands={taxonomies?.brands || []}
                    onCategoriesChange={async (categories) => {
                      try {
                        await supabase
                          .from('products')
                          .update({ categories: categories as any })
                          .eq('id', productId);
                        
                        toast.success("קטגוריות עודכנו בהצלחה");
                        
                        // Sync to WooCommerce
                        const { error } = await supabase.functions.invoke('update-woo-product', {
                          body: { 
                            product: { ...product, categories, id: productId }, 
                            store_id: storeId 
                          }
                        });
                        
                        if (error) {
                          toast.error("שגיאה בסנכרון ל-WooCommerce");
                        } else {
                          toast.success("סונכרן ל-WooCommerce בהצלחה");
                        }
                        
                        refetch();
                      } catch (error) {
                        toast.error("שגיאה בעדכון קטגוריות");
                      }
                    }}
                    onTagsChange={async (tags) => {
                      try {
                        await supabase
                          .from('products')
                          .update({ tags: tags as any })
                          .eq('id', productId);
                        
                        toast.success("תגים עודכנו בהצלחה");
                        
                        // Sync to WooCommerce
                        const { error } = await supabase.functions.invoke('update-woo-product', {
                          body: { 
                            product: { ...product, tags, id: productId }, 
                            store_id: storeId 
                          }
                        });
                        
                        if (error) {
                          toast.error("שגיאה בסנכרון ל-WooCommerce");
                        } else {
                          toast.success("סונכרן ל-WooCommerce בהצלחה");
                        }
                        
                        refetch();
                      } catch (error) {
                        toast.error("שגיאה בעדכון תגים");
                      }
                    }}
                    onBrandsChange={async (brands) => {
                      try {
                        await supabase
                          .from('products')
                          .update({ brands: brands as any })
                          .eq('id', productId);
                        
                        toast.success("מותגים עודכנו בהצלחה");
                        
                        // Sync to WooCommerce
                        const { error } = await supabase.functions.invoke('update-woo-product', {
                          body: { 
                            product: { ...product, brands, id: productId }, 
                            store_id: storeId 
                          }
                        });
                        
                        if (error) {
                          toast.error("שגיאה בסנכרון ל-WooCommerce");
                        } else {
                          toast.success("סונכרן ל-WooCommerce בהצלחה");
                        }
                        
                        refetch();
                      } catch (error) {
                        toast.error("שגיאה בעדכון מותגים");
                      }
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
