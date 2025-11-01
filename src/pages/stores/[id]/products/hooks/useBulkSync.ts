import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBulkSync = (storeId: string | undefined) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncAllProducts = async () => {
    if (!storeId) {
      toast.error("חסר מזהה חנות");
      return;
    }

    setIsSyncing(true);
    const loadingToast = toast.loading("מסנכרן מוצרים לווקומרס...");

    try {
      const { data, error } = await supabase.functions.invoke('bulk-sync-to-woo', {
        body: { store_id: storeId }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `סונכרנו ${data.synced} מוצרים בהצלחה${data.failed > 0 ? `, ${data.failed} נכשלו` : ''}`,
          { id: loadingToast }
        );

        if (data.errors && data.errors.length > 0) {
          console.error('Sync errors:', data.errors);
        }
      } else {
        toast.error(data.error || "שגיאה בסנכרון המוצרים", { id: loadingToast });
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      toast.error(
        error instanceof Error ? error.message : "שגיאה בסנכרון המוצרים",
        { id: loadingToast }
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncAllProducts,
    isSyncing
  };
};
