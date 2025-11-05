import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, CheckCircle2, XCircle, RefreshCw, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Store = Tables<"stores">;

// Temporary type until Supabase types are regenerated
interface WebhookLog {
  id: string;
  store_id: string;
  topic: string;
  status: 'success' | 'failed';
  error_message: string | null;
  received_at: string;
  created_at: string;
}

interface WebhookLogsViewerProps {
  store: Store;
}

export function WebhookLogsViewer({ store }: WebhookLogsViewerProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['webhook_logs', store.id, statusFilter, limit],
    queryFn: async () => {
      let query = supabase
        .from('webhook_logs')
        .select('*')
        .eq('store_id', store.id)
        .order('received_at', { ascending: false })
        .limit(limit);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WebhookLog[];
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const successCount = logs?.filter(log => log.status === 'success').length || 0;
  const failedCount = logs?.filter(log => log.status === 'failed').length || 0;
  const successRate = logs?.length ? ((successCount / logs.length) * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Webhook Activity Logs
            </CardTitle>
            <CardDescription>
              Real-time monitoring of webhook deliveries and processing
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Successful</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {successCount}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-red-50 dark:bg-red-950">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {failedCount}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {successRate}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="status-filter">Status Filter</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success Only</SelectItem>
                <SelectItem value="failed">Failed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label htmlFor="limit-select">Show Entries</Label>
            <Select value={limit.toString()} onValueChange={(val) => setLimit(parseInt(val))}>
              <SelectTrigger id="limit-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">Last 25</SelectItem>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="100">Last 100</SelectItem>
                <SelectItem value="250">Last 250</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="hidden md:table-cell">Error Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Loading logs...</p>
                  </TableCell>
                </TableRow>
              ) : !logs || logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-2">
                      No webhook activity yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Logs will appear here when webhooks are received
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge
                        variant={log.status === 'success' ? 'default' : 'destructive'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {log.status === 'success' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{log.topic}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.received_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {log.error_message ? (
                        <span className="text-sm text-destructive font-mono">
                          {log.error_message}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {logs && logs.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing {logs.length} most recent webhook events. Auto-refreshes every 10 seconds.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
