import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Download, RefreshCw, BarChart3 } from "lucide-react";
import { AuditFilters } from "./components/AuditFilters";
import { AuditLogTable } from "./components/AuditLogTable";
import { CriticalChangesCard } from "./components/CriticalChangesCard";
import { RealtimeStatus } from "./components/RealtimeStatus";
import { useAuditLogs } from "./hooks/useAuditLogs";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogsPage() {
  const [tableName, setTableName] = useState("all");
  const [action, setAction] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useAuditLogs({
    tableName: tableName === "all" ? undefined : tableName,
    action: action === "all" ? undefined : action,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    pageSize: 50,
  });

  const handleReset = () => {
    setTableName("all");
    setAction("all");
    setStartDate("");
    setEndDate("");
    setUserEmail("");
    setPage(1);
  };

  const handleExport = () => {
    if (!data?.logs) return;

    const csv = [
      ['Timestamp', 'Table', 'Action', 'User', 'Record ID', 'Changed Fields'].join(','),
      ...data.logs.map((log) =>
        [
          log.created_at,
          log.table_name,
          log.action,
          log.user_email || 'System',
          log.record_id,
          log.changed_fields?.join(';') || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Audit Logs</h1>
            </div>
            <p className="text-muted-foreground">
              Track all sensitive changes to your system tables
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/audit-logs/analytics')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={!data?.logs?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  data?.count.toLocaleString() || 0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {page} / {data?.totalPages || 1}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  data?.logs.length || 0
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <AuditFilters
              tableName={tableName}
              setTableName={setTableName}
              action={action}
              setAction={setAction}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              onReset={handleReset}
            />

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>
                  Click on any row to see detailed change information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <AuditLogTable logs={data?.logs || []} />
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RealtimeStatus />
            <CriticalChangesCard />
          </div>
        </div>
      </div>
    </Shell>
  );
}
