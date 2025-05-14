
/**
 * Utility functions for dashboard calculations
 */

// Helper function to get the last N days of order data
export function getLastNDaysData(orders: any[] | undefined, days: number) {
  if (!orders || orders.length === 0) {
    // Return empty data if no orders
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1) + i);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 0
      };
    });
  }

  // Create a map for the last N days
  const daysMap = new Map();
  
  // Initialize the map with the last N days
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1) + i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    daysMap.set(dateStr, { name: dateStr, value: 0 });
  }
  
  // Fill in the actual revenue data
  orders.forEach(order => {
    const orderDate = new Date(order.created_at);
    const dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Only count if the order is within our days range
    if (daysMap.has(dateStr)) {
      const existing = daysMap.get(dateStr);
      daysMap.set(dateStr, { 
        name: dateStr, 
        value: existing.value + Number(order.total)
      });
    }
  });
  
  // Convert the map to an array and sort by date
  return Array.from(daysMap.values());
}

// Helper function to calculate percentage change
export function getPercentageChange(data: { name: string; value: number }[]) {
  if (data.length < 2) return 0;
  
  const currentValue = data[data.length - 1].value;
  const previousValue = data[data.length - 2].value;
  
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
}

// Calculate dashboard statistics
export function calculateDashboardStats(orders: any[] | undefined, products: any[] | undefined) {
  // Calculate total revenue from orders
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  
  // Calculate number of pending orders
  const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
  
  // Calculate out of stock products
  const outOfStock = products?.filter(product => 
    product.stock_quantity !== null && product.stock_quantity <= 0
  ).length || 0;
  
  // Calculate low stock products (less than 5 in stock)
  const lowStock = products?.filter(product => 
    product.stock_quantity !== null && 
    product.stock_quantity > 0 && 
    product.stock_quantity < 5
  ).length || 0;
  
  // Calculate % of products that are out of stock
  const outOfStockPercentage = products?.length ? 
    Math.round((outOfStock / products.length) * 100) : 0;
  
  // Calculate average order value
  const averageOrderValue = orders?.length ? 
    (totalRevenue / orders.length) : 0;
    
  return {
    totalRevenue,
    pendingOrders,
    outOfStock,
    lowStock,
    outOfStockPercentage,
    averageOrderValue,
    totalOrders: orders?.length || 0,
    totalProducts: products?.length || 0,
  };
}
