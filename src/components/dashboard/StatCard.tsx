
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, LucideIcon } from "lucide-react";

interface StatCardProps {
  name: string;
  value: string;
  description: string;
  secondaryDescription?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
}

const StatCard = ({ 
  name, 
  value, 
  description, 
  secondaryDescription, 
  trend, 
  icon: Icon 
}: StatCardProps) => {
  return (
    <Card className="hover-scale">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {name}
        </CardTitle>
        <div className="flex items-center space-x-1">
          {trend === 'up' && (
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          )}
          {trend === 'down' && (
            <ArrowDown className="h-4 w-4 text-rose-500" />
          )}
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {secondaryDescription && (
          <p className="text-xs text-muted-foreground mt-1">
            {secondaryDescription}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
