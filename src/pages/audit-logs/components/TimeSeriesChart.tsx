import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface TimeSeriesData {
  date: string;
  count: number;
  inserts: number;
  updates: number;
  deletes: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'dd/MM'),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>
          Changes over time by action type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="inserts" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={2}
              name="Inserts"
            />
            <Line 
              type="monotone" 
              dataKey="updates" 
              stroke="hsl(221, 83%, 53%)" 
              strokeWidth={2}
              name="Updates"
            />
            <Line 
              type="monotone" 
              dataKey="deletes" 
              stroke="hsl(0, 84%, 60%)" 
              strokeWidth={2}
              name="Deletes"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
