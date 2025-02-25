
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrderStatusLog } from "../types";

interface StatusHistoryProps {
  logs: OrderStatusLog[];
}

export function StatusHistory({ logs }: StatusHistoryProps) {
  if (logs.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No status changes recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="flex justify-between items-center border-b pb-2">
          <div>
            <p className="font-medium">
              {log.old_status} → {log.new_status}
            </p>
            <p className="text-sm text-muted-foreground">
              Changed by: {log.changed_by}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(log.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
