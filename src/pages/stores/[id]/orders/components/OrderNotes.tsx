import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface OrderNote {
  id: number;
  author: string;
  date_created: string;
  note: string;
  customer_note: boolean;
}

interface OrderNotesProps {
  notes?: OrderNote[];
  isLoading?: boolean;
  error?: Error | null;
}

export const OrderNotes = ({ notes, isLoading, error }: OrderNotesProps) => {
  if (error) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Order Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load order notes</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Order Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Order Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No notes for this order</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Order Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border-l-2 border-primary pl-4 py-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{note.author}</span>
                {note.customer_note && (
                  <Badge variant="secondary" className="text-xs">
                    Customer Note
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {format(new Date(note.date_created), "MMM d, yyyy HH:mm")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
