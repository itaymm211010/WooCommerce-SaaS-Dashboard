
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

// Add the missing getStatusColor function
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "publish":
      return "bg-green-100 text-green-800 border-green-300";
    case "draft":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "pending":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "private":
      return "bg-purple-100 text-purple-800 border-purple-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};
