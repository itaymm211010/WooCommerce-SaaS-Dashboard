import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface TableDistributionData {
  table_name: string;
  count: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface TableDistributionChartProps {
  data: TableDistributionData[];
}

const COLORS = {
  CRITICAL: 'hsl(0, 84%, 60%)',    // red
  HIGH: 'hsl(25, 95%, 53%)',       // orange
  MEDIUM: 'hsl(221, 83%, 53%)',    // blue
  LOW: 'hsl(142, 76%, 36%)',       // green
};

export function TableDistributionChart({ data }: TableDistributionChartProps) {
  const topTables = data.slice(0, 8); // Top 8 tables
  const othersCount = data.slice(8).reduce((sum, item) => sum + item.count, 0);
  
  const chartData = [
    ...topTables,
    ...(othersCount > 0 ? [{ table_name: 'Others', count: othersCount, severity: 'LOW' as const }] : [])
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changes by Table</CardTitle>
        <CardDescription>
          Distribution of changes across different tables
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ table_name, percent }) => 
                `${table_name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.severity]}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
