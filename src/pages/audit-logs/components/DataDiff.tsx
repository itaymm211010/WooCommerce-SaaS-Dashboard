import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, Minus, Edit } from "lucide-react";

interface DataDiffProps {
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData: Record<string, any> | null;
  newData: Record<string, any> | null;
  changedFields?: string[] | null;
}

export function DataDiff({ action, oldData, newData, changedFields }: DataDiffProps) {
  if (action === 'INSERT') {
    return (
      <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-800 dark:text-green-300">New Record Created</span>
        </div>
        <div className="space-y-1 text-sm">
          {newData && Object.entries(newData).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <span className="font-medium text-muted-foreground min-w-[120px]">{key}:</span>
              <span className="text-green-700 dark:text-green-400 font-mono">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (action === 'DELETE') {
    return (
      <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
        <div className="flex items-center gap-2 mb-3">
          <Minus className="h-4 w-4 text-red-600" />
          <span className="font-semibold text-red-800 dark:text-red-300">Record Deleted</span>
        </div>
        <div className="space-y-1 text-sm">
          {oldData && Object.entries(oldData).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <span className="font-medium text-muted-foreground min-w-[120px]">{key}:</span>
              <span className="text-red-700 dark:text-red-400 font-mono line-through">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // UPDATE - show only changed fields
  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
      <div className="flex items-center gap-2 mb-3">
        <Edit className="h-4 w-4 text-blue-600" />
        <span className="font-semibold text-blue-800 dark:text-blue-300">Record Updated</span>
        {changedFields && (
          <Badge variant="secondary" className="ml-2">
            {changedFields.length} {changedFields.length === 1 ? 'field' : 'fields'} changed
          </Badge>
        )}
      </div>
      <div className="space-y-3">
        {changedFields && changedFields.map((field) => {
          const oldValue = oldData?.[field];
          const newValue = newData?.[field];
          
          return (
            <div key={field} className="border-l-2 border-blue-300 dark:border-blue-700 pl-3">
              <div className="font-medium text-sm text-muted-foreground mb-1">{field}</div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <span className="text-red-600 dark:text-red-400 font-mono">
                    {typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : String(oldValue)}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-green-600 dark:text-green-400 font-mono">
                    {typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : String(newValue)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
