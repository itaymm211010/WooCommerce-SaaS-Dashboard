import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface SyncChartsProps {
  syncsByDay: Array<{
    date: string;
    total: number;
    success: number;
    failed: number;
  }>;
  errorsByType: Array<{
    entity_type: string;
    count: number;
  }>;
}

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

export const SyncCharts = ({ syncsByDay, errorsByType }: SyncChartsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sync Success Rate Over Time</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                success: {
                  label: "Success",
                  color: "#10B981",
                },
                failed: {
                  label: "Failed",
                  color: "#EF4444",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={syncsByDay}
                  margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Success"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Errors by Entity Type</CardTitle>
          <CardDescription>Distribution of sync errors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                errors: {
                  label: "Errors",
                  color: "#8B5CF6",
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                {errorsByType && errorsByType.length > 0 ? (
                  <BarChart
                    data={errorsByType}
                    margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="entity_type" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill="#8B5CF6"
                      radius={[8, 8, 0, 0]}
                      name="Error Count"
                    />
                  </BarChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No error data available
                  </div>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
