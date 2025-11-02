
import { TrendingUp, Users, Package, ShoppingCart } from "lucide-react";
import StatCard from "./StatCard";
import { formatCurrency } from "@/lib/utils";

interface StatCardsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    outOfStock: number;
    outOfStockPercentage: number;
    lowStock: number;
    averageOrderValue: number;
  };
  revenueChangePercentage: number;
  revenueTrend: 'up' | 'down' | 'neutral';
  currency?: string;
}

const StatCards = ({ stats, revenueChangePercentage, revenueTrend, currency = 'ILS' }: StatCardsProps) => {
  const { 
    totalRevenue, 
    totalOrders, 
    pendingOrders, 
    totalProducts, 
    outOfStock, 
    outOfStockPercentage, 
    lowStock, 
    averageOrderValue 
  } = stats;

  const statCards = [
    {
      name: "Total Revenue",
      value: formatCurrency(totalRevenue, currency),
      description: `${revenueChangePercentage}% ${revenueTrend === 'up' ? 'increase' : 'decrease'} from last day`,
      trend: revenueTrend,
      icon: TrendingUp
    },
    {
      name: "Orders",
      value: totalOrders.toString(),
      description: `${pendingOrders} pending orders`,
      icon: ShoppingCart
    },
    {
      name: "Products",
      value: totalProducts.toString(),
      description: `${outOfStock} out of stock (${outOfStockPercentage}%)`,
      secondaryDescription: `${lowStock} low stock`,
      icon: Package
    },
    {
      name: "Avg. Order Value",
      value: formatCurrency(averageOrderValue, currency),
      description: `${totalOrders} total orders`,
      icon: TrendingUp
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <StatCard key={stat.name} {...stat} />
      ))}
    </div>
  );
};

export default StatCards;
