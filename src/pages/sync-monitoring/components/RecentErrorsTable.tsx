import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Loader2, Eye } from "lucide-react";
import { useState } from "react";

interface SyncError {
  id: string;
  created_at: string;
  entity_type: string;
  error_message: string;
  stack_trace: string | null;
  retry_count: number;
  stores: { name: string } | null;
  metadata: any;
}

interface RecentErrorsTableProps {
  errors: SyncError[];
  isLoading: boolean;
}

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

const getRetryColor = (count: number) => {
  if (count === 0) return 'bg-green-500/10 text-green-600';
  if (count <= 2) return 'bg-yellow-500/10 text-yellow-600';
  return 'bg-red-500/10 text-red-600';
};

export const RecentErrorsTable = ({ errors, isLoading }: RecentErrorsTableProps) => {
  const [selectedError, setSelectedError] = useState<SyncError | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!errors || errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>No sync errors found</p>
        <p className="text-sm">Great! All syncs are working properly</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Error Message</TableHead>
              <TableHead>Retry Count</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((error) => (
              <TableRow key={error.id}>
                <TableCell className="font-medium">
                  {format(new Date(error.created_at), 'MMM dd, HH:mm:ss')}
                </TableCell>
                <TableCell>{error.stores?.name || 'Unknown'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getEntityColor(error.entity_type)}>
                    {error.entity_type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {error.error_message}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRetryColor(error.retry_count)}>
                    {error.retry_count}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedError(error)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              {selectedError && format(new Date(selectedError.created_at), 'MMM dd, yyyy HH:mm:ss')}
            </DialogDescription>
          </DialogHeader>
          {selectedError && (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Store</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.stores?.name || 'Unknown'}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Entity Type</h4>
                  <Badge variant="outline" className={getEntityColor(selectedError.entity_type)}>
                    {selectedError.entity_type}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Error Message</h4>
                  <p className="text-sm text-muted-foreground">{selectedError.error_message}</p>
                </div>

                {selectedError.stack_trace && (
                  <div>
                    <h4 className="font-semibold mb-2">Stack Trace</h4>
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                      {selectedError.stack_trace}
                    </pre>
                  </div>
                )}

                {selectedError.metadata && Object.keys(selectedError.metadata).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Metadata</h4>
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                      {JSON.stringify(selectedError.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Retry Count</h4>
                  <Badge variant="outline" className={getRetryColor(selectedError.retry_count)}>
                    {selectedError.retry_count} attempts
                  </Badge>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
