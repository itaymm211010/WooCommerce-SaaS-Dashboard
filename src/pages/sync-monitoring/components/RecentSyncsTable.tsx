import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface SyncLog {
  id: string;
  created_at: string;
  entity_type: string;
  action: string;
  status: string;
  duration_ms: number | null;
  stores: { name: string } | null;
  metadata: any;
}

interface RecentSyncsTableProps {
  logs: SyncLog[];
  isLoading: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'bg-green-500/10 text-green-600 hover:bg-green-500/20';
    case 'failed':
      return 'bg-red-500/10 text-red-600 hover:bg-red-500/20';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
  }
};

const getEntityColor = (type: string) => {
  switch (type) {
    case 'product':
      return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20';
    case 'category':
      return 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20';
    case 'tag':
      return 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20';
    case 'brand':
      return 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20';
  }
};

export const RecentSyncsTable = ({ logs, isLoading }: RecentSyncsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>No sync logs found</p>
        <p className="text-sm">Run a sync operation to see logs here</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Entity Type</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
              </TableCell>
              <TableCell>{log.stores?.name || 'Unknown'}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getEntityColor(log.entity_type)}>
                  {log.entity_type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {log.action.replace(/_/g, ' ')}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(log.status)}>
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell>
                {log.duration_ms 
                  ? log.duration_ms < 1000 
                    ? `${log.duration_ms}ms` 
                    : `${(log.duration_ms / 1000).toFixed(1)}s`
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
