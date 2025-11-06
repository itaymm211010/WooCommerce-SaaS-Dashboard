import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type Store = Tables<"stores">;
type Order = Tables<"orders">;

interface OrderNote {
  id: number;
  author: string;
  date_created: string;
  note: string;
  customer_note: boolean;
  order_id: number;
}

interface RecentOrderNotesProps {
  store?: Store;
  orders?: Order[];
}

export const RecentOrderNotes = ({ store, orders }: RecentOrderNotesProps) => {
  const recentOrders = orders?.slice(0, 10) || [];
  
  const { data: notes, isLoading } = useQuery({
    queryKey: ['recent-order-notes', store?.id, recentOrders.map(o => o.woo_id)],
    queryFn: async () => {
      if (!store || recentOrders.length === 0) return [];

      const allNotes: OrderNote[] = [];

      // Fetch notes for recent orders via secure proxy
      for (const order of recentOrders) {
        try {
          const { data, error } = await supabase.functions.invoke('woo-proxy', {
            body: {
              storeId: store.id,
              endpoint: `/wp-json/wc/v3/orders/${order.woo_id}/notes`,
              method: 'GET'
            }
          });

          if (!error && data) {
            const orderNotes: OrderNote[] = Array.isArray(data) ? data : [];
            allNotes.push(...orderNotes.map(note => ({ ...note, order_id: order.woo_id })));
          }
        } catch (error) {
          console.error(`Failed to fetch notes for order ${order.woo_id}`, error);
        }
      }
      
      // Sort by date, newest first, and take only the most recent 5
      return allNotes
        .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())
        .slice(0, 5);
    },
    enabled: !!store && recentOrders.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (!store) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            הערות הזמנות אחרונות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">בחר חנות כדי לראות הערות</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            הערות הזמנות אחרונות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            הערות הזמנות אחרונות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">אין הערות בהזמנות האחרונות</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          הערות הזמנות אחרונות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border-l-2 border-primary/50 pl-3 py-2 hover:bg-accent/50 transition-colors rounded-r"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-medium">הזמנה #{note.order_id}</span>
                <span className="text-xs text-muted-foreground">{note.author}</span>
                {note.customer_note && (
                  <Badge variant="secondary" className="text-xs">
                    הערת לקוח
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground mr-auto">
                  {format(new Date(note.date_created), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
              <p className="text-sm line-clamp-2">{note.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
