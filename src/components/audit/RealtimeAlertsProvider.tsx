import { useRealtimeAuditAlerts } from "@/hooks/useRealtimeAuditAlerts";
import { useAuth } from "@/contexts/AuthContext";

interface RealtimeAlertsProviderProps {
  children: React.ReactNode;
}

export function RealtimeAlertsProvider({ children }: RealtimeAlertsProviderProps) {
  const { user } = useAuth();

  // Only enable realtime alerts for authenticated users
  if (user) {
    useRealtimeAuditAlerts();
  }

  return <>{children}</>;
}
