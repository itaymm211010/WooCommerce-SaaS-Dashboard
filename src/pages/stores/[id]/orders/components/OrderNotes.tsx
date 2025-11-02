import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface OrderNote {
  id: number;
  author: string;
  date_created: string;
  note: string;
  customer_note: boolean;
}

interface OrderNotesProps {
  notes: OrderNote[];
}

export const OrderNotes = ({ notes }: OrderNotesProps) => {
  if (!notes || notes.length === 0) {
    return null;
  }

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
  );

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Order Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedNotes.map((note) => (
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
