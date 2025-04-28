
import { formatCurrency } from "../../../utils/currencyUtils";

export const getProductPrice = (product: any) => {
  if (product.type === 'variable' && product.variations && product.variations.length > 0) {
    const prices = product.variations.map((variation: any) => {
      return parseFloat(variation.regular_price || variation.price || 0);
    }).filter((price: number) => price > 0);

    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      return minPrice;
    }
    return 0;
  }

  if (product.regular_price) {
    return parseFloat(product.regular_price);
  }

  if (product.price) {
    return parseFloat(product.price);
  }

  return 0;
};

export const formatPrice = (price: number | null, productType: string, currency: string = 'USD') => {
  if (price === 0 || price === null) {
    return productType === 'variable' ? 'Variable Product' : 'N/A';
  }
  return formatCurrency(price, currency);
};
