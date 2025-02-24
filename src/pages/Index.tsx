
import { Shell } from "@/components/layout/Shell";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { TrendingUp, Users, Package, ShoppingCart } from "lucide-react";

const stats = [
  {
    name: "Total Revenue",
    value: "$45,231.89",
    description: "+20.1% from last month",
    icon: TrendingUp
  },
  {
    name: "Orders",
    value: "2,345",
    description: "150 pending orders",
    icon: ShoppingCart
  },
  {
    name: "Products",
    value: "12,234",
    description: "321 out of stock",
    icon: Package
  },
  {
    name: "Active Customers",
    value: "573",
    description: "+201 this week",
    icon: Users
  }
];

const Index = () => {
  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your store performance
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="hover-scale">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
};

export default Index;
