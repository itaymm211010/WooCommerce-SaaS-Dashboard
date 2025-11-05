import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebhooksManager } from "@/pages/stores/components/WebhooksManager";

export default function StoreWebhooksPage() {
  const { id } = useParams<{ id: string }>();

  const { data: store, isLoading } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Store not found</h2>
          <Link to="/stores">
            <Button className="mt-4">Back to Stores</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">{store.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/stores/${id}/products`}>
            <Button variant="outline">Products</Button>
          </Link>
          <Link to={`/stores/${id}/orders`}>
            <Button variant="outline">Orders</Button>
          </Link>
        </div>
      </div>

      {/* Webhooks Manager */}
      <WebhooksManager store={store} />
    </div>
  );
}
