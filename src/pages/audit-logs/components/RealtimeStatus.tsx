import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function RealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const channel = supabase.channel('status-check');
    
    channel
      .on('system', {}, (payload) => {
        if (payload.status === 'ok') {
          setIsConnected(true);
          setLastUpdate(new Date());
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Realtime Connected</div>
                  <div className="text-xs text-muted-foreground">
                    Monitoring critical changes
                  </div>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium">Realtime Disconnected</div>
                  <div className="text-xs text-muted-foreground">
                    Attempting to reconnect...
                  </div>
                </div>
              </>
            )}
          </div>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Live" : "Offline"}
          </Badge>
        </div>
        {lastUpdate && (
          <div className="mt-3 text-xs text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
