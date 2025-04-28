
import { Store } from "@/types/database";
import { supabase } from "@/lib/supabase";
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
    let baseUrl = store.url.replace(/\/+$/, '');
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }

    const storeResponse = await fetch(
      `${baseUrl}/wp-json/wc/v3/settings/general?consumer_key=${store.api_key}&consumer_secret=${store.api_secret}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!storeResponse.ok) {
      console.error('Failed to fetch store settings');
      return;
    }

    const settings = await storeResponse.json();
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
