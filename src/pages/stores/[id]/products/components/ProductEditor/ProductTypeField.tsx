import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Package, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductTypeFieldProps {
  productId?: string;
  storeId: string;
  isNewProduct: boolean;
  onTypeChange?: (newType: string) => void;
}

export function ProductTypeField({ 
  productId, 
  storeId, 
  isNewProduct,
  onTypeChange 
}: ProductTypeFieldProps) {
  const form = useFormContext();
  const [showVariableToSimpleAlert, setShowVariableToSimpleAlert] = useState(false);
  const [showSimpleToVariableAlert, setShowSimpleToVariableAlert] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);
  const [isChangingType, setIsChangingType] = useState(false);

  const handleTypeChange = async (newType: string) => {
    const currentType = form.getValues("type");
    
    // אם אין שינוי, לא עושים כלום
    if (currentType === newType) return;

    setPendingType(newType);

    // אם זה מוצר חדש, פשוט משנים את הסוג
    if (isNewProduct) {
      form.setValue("type", newType);
      onTypeChange?.(newType);
      return;
    }

    // מעבר מ-variable ל-simple
    if (currentType === "variable" && newType === "simple") {
      setShowVariableToSimpleAlert(true);
      return;
    }

    // מעבר מ-simple ל-variable
    if (currentType === "simple" && newType === "variable") {
      setShowSimpleToVariableAlert(true);
      return;
    }
  };

  const confirmVariableToSimple = async () => {
    try {
      setIsChangingType(true);
      
      // מחיקת כל הוריאציות מהבסיס נתונים
      const { error: deleteError } = await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", productId)
        .eq("store_id", storeId);

      if (deleteError) throw deleteError;

      // עדכון סוג המוצר
      const { error: updateError } = await supabase
        .from("products")
        .update({ type: "simple", price: null, sale_price: null })
        .eq("id", productId)
        .eq("store_id", storeId);

      if (updateError) throw updateError;

      // סנכרון ל-WooCommerce
      const { data: productData } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (productData && productData.woo_id) {
        const { error: syncError } = await supabase.functions.invoke('update-woo-product', {
          body: { 
            product: productData, 
            store_id: storeId 
          }
        });
        
        if (syncError) {
          console.error('Failed to sync to WooCommerce:', syncError);
          toast.error('המוצר עודכן בהצלחה אך הסנכרון ל-WooCommerce נכשל');
        }
      }

      form.setValue("type", "simple");
      onTypeChange?.("simple");
      toast.success("המוצר שונה למוצר רגיל והוריאציות נמחקו");
      
      setShowVariableToSimpleAlert(false);
    } catch (error: any) {
      console.error("Error changing product type:", error);
      toast.error(`שגיאה בשינוי סוג המוצר: ${error.message}`);
    } finally {
      setIsChangingType(false);
    }
  };

  const confirmSimpleToVariable = async () => {
    try {
      setIsChangingType(true);

      // בדיקה אם יש attributes עם variation: true
      const { data: attributes, error: attrError } = await supabase
        .from("product_attributes")
        .select("*")
        .eq("product_id", productId)
        .eq("store_id", storeId)
        .eq("variation", true);

      if (attrError) throw attrError;

      if (!attributes || attributes.length === 0) {
        toast.error("לפני המעבר למוצר עם וריאציות, עליך להגדיר תכונות בלשונית 'תכונות'");
        setShowSimpleToVariableAlert(false);
        setIsChangingType(false);
        return;
      }

      // עדכון סוג המוצר
      const { error: updateError } = await supabase
        .from("products")
        .update({ type: "variable" })
        .eq("id", productId)
        .eq("store_id", storeId);

      if (updateError) throw updateError;

      // סנכרון ל-WooCommerce כולל attributes
      const { data: productData } = await supabase
        .from("products")
        .select(`
          *,
          product_attributes (*)
        `)
        .eq("id", productId)
        .single();

      if (productData && productData.woo_id) {
        const { error: syncError } = await supabase.functions.invoke('update-woo-product', {
          body: { 
            product: {
              ...productData,
              attributes: productData.product_attributes
            }, 
            store_id: storeId 
          }
        });
        
        if (syncError) {
          console.error('Failed to sync to WooCommerce:', syncError);
          toast.error('המוצר עודכן בהצלחה אך הסנכרון ל-WooCommerce נכשל');
        }
      }

      form.setValue("type", "variable");
      onTypeChange?.("variable");
      toast.success("המוצר שונה למוצר עם וריאציות. כעת תוכל להוסיף וריאציות בלשונית 'וריאציות'");
      
      setShowSimpleToVariableAlert(false);
    } catch (error: any) {
      console.error("Error changing product type:", error);
      toast.error(`שגיאה בשינוי סוג המוצר: ${error.message}`);
    } finally {
      setIsChangingType(false);
    }
  };

  return (
    <>
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>סוג מוצר</FormLabel>
            <Select
              onValueChange={handleTypeChange}
              value={field.value}
              disabled={isChangingType}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג מוצר" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="simple">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>מוצר רגיל</span>
                  </div>
                </SelectItem>
                <SelectItem value="variable">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>מוצר עם וריאציות</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              {field.value === "simple" 
                ? "מוצר רגיל עם מחיר אחד" 
                : "מוצר עם מספר וריאציות (גודל, צבע, וכו')"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Alert for Variable -> Simple */}
      <AlertDialog open={showVariableToSimpleAlert} onOpenChange={setShowVariableToSimpleAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              שינוי המוצר למוצר רגיל ימחק את כל הוריאציות הקיימות. 
              פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmVariableToSimple}
              disabled={isChangingType}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isChangingType ? "מוחק..." : "כן, מחק את הוריאציות"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert for Simple -> Variable */}
      <AlertDialog open={showSimpleToVariableAlert} onOpenChange={setShowSimpleToVariableAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מעבר למוצר עם וריאציות</AlertDialogTitle>
            <AlertDialogDescription>
              כדי ליצור מוצר עם וריאציות, ודא שהגדרת תכונות (Attributes) בלשונית 'תכונות'.
              לאחר מכן תוכל ליצור וריאציות בלשונית 'וריאציות'.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSimpleToVariable}
              disabled={isChangingType}
            >
              {isChangingType ? "משנה..." : "המשך"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
