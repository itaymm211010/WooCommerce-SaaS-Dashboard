import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface UserActivityData {
  user_email: string;
  total_changes: number;
  inserts: number;
  updates: number;
  deletes: number;
}

interface UserActivityChartProps {
  data: UserActivityData[];
}

export function UserActivityChart({ data }: UserActivityChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    user: item.user_email.split('@')[0] || item.user_email,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Active Users</CardTitle>
        <CardDescription>
          Users with most changes in the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="user" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              angle={-45}
              textAnchor="end"
              height={80}
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
            <Bar dataKey="inserts" fill="hsl(142, 76%, 36%)" stackId="a" name="Inserts" />
            <Bar dataKey="updates" fill="hsl(221, 83%, 53%)" stackId="a" name="Updates" />
            <Bar dataKey="deletes" fill="hsl(0, 84%, 60%)" stackId="a" name="Deletes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
