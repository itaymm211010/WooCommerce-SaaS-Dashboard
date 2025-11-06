import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncToWooButtonProps {
  storeId: string;
  productId: string;
  disabled?: boolean;
}

export function SyncToWooButton({ storeId, productId, disabled }: SyncToWooButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);

      // Fetch the latest product data from the database
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("store_id", storeId)
        .single();

      if (fetchError) throw fetchError;

      console.log('מסנכרן מוצר ל-WooCommerce:', productId);

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please log in again.');
      }

      // Call the edge function to sync with WooCommerce
      const { data, error } = await supabase.functions.invoke('update-woo-product', {
        body: {
          product,
          store_id: storeId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("המוצר סונכרן בהצלחה עם WooCommerce");

        // If this was a new product (woo_id === 0), update the woo_id
        if (product.woo_id === 0 && data.woo_id) {
          const { error: updateError } = await supabase
            .from("products")
            .update({ woo_id: data.woo_id })
            .eq("id", productId);

          if (updateError) {
            console.error("Error updating product with new WooCommerce ID:", updateError);
          }
        }
      }
    } catch (error: any) {
      console.error("Error syncing to WooCommerce:", error);
      toast.error(`שגיאה בסנכרון ל-WooCommerce: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={disabled || isSyncing}
      variant="outline"
      size="sm"
      className="gap-2 w-full sm:w-auto"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">{isSyncing ? "מסנכרן..." : "עדכן ב-WooCommerce"}</span>
      <span className="sm:hidden">{isSyncing ? "מסנכרן..." : "עדכן"}</span>
    </Button>
  );
}
