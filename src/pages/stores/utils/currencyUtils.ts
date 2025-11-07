
import type { Tables } from "@/integrations/supabase/types";

type Store = Tables<"stores">;
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Map of currency codes to their symbols and formatting options
export const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  ILS: '₪',  // Added Israeli Shekel
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
};

// Format a price with the appropriate currency symbol based on store currency
export function formatCurrency(price: number, currencyCode: string = 'USD') {
  const symbol = currencySymbols[currencyCode] || currencyCode;
  
  // Handle languages that place currency symbol after the number (like Hebrew)
  const isRtlCurrency = currencyCode === 'ILS';
  
  if (isRtlCurrency) {
    return `${price.toLocaleString()} ${symbol}`;
  } else {
    return `${symbol}${price.toLocaleString()}`;
  }
}

export async function checkAndUpdateStoreCurrency(store: Store) {
  try {
    // Fetch store settings via secure proxy
    const { data: settings, error: fetchError } = await supabase.functions.invoke('woo-proxy', {
      body: {
        storeId: store.id,
        endpoint: '/wp-json/wc/v3/settings/general',
        method: 'GET'
      }
    });

    if (fetchError || !settings) {
      console.error('Failed to fetch store settings:', fetchError?.message || 'Unknown error');
      return;
    }

    const currencySetting = settings.find((setting: any) => setting.id === 'woocommerce_currency');

    if (currencySetting && currencySetting.value !== store.currency) {
      console.log(`Currency changed from ${store.currency} to ${currencySetting.value}`);
      const { error } = await supabase
        .from('stores')
        .update({ currency: currencySetting.value })
        .eq('id', store.id);

      if (error) {
        console.error('Failed to update store currency:', error);
        return;
      }

      toast.info(`Store currency updated to ${currencySetting.value}`);
    }
  } catch (error) {
    console.error('Error checking store currency:', error);
  }
}
