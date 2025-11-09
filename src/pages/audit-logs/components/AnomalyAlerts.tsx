import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Anomaly } from "../hooks/useAnomalyDetection";

interface AnomalyAlertsProps {
  anomalies: Anomaly[];
}

const getAnomalyIcon = (type: Anomaly['type']) => {
  switch (type) {
    case 'user_activity':
      return AlertTriangle;
    case 'critical_spike':
      return ShieldAlert;
    case 'high_frequency':
      return AlertCircle;
    case 'suspicious_pattern':
      return AlertTriangle;
    default:
      return Info;
  }
};

const getSeverityVariant = (severity: Anomaly['severity']): "default" | "destructive" | "secondary" => {
  switch (severity) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
  }
};

const getSeverityColor = (severity: Anomaly['severity']) => {
  switch (severity) {
    case 'high':
      return 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30';
    case 'medium':
      return 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30';
    case 'low':
      return 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-950/30';
  }
};

export function AnomalyAlerts({ anomalies }: AnomalyAlertsProps) {
  const { toast } = useToast();
  const [processingAnomaly, setProcessingAnomaly] = useState<string | null>(null);

  const handleTakeAction = async (anomaly: Anomaly) => {
    setProcessingAnomaly(anomaly.id);

    try {
      // Determine actions based on severity and type
      const actions: Array<'send_email' | 'suspend_user' | 'create_log'> = ['create_log'];
      
      if (anomaly.severity === 'high') {
        actions.push('send_email');
      }

      if (anomaly.type === 'user_activity' && anomaly.severity === 'high') {
        actions.push('suspend_user');
      }

      const { data, error } = await supabase.functions.invoke('handle-anomaly-response', {
        body: {
          anomaly,
          actions,
        },
      });

      if (error) throw error;

      toast({
        title: "Actions Executed",
        description: `Successfully executed ${actions.length} automated response actions`,
      });

      console.log("Automated response results:", data);
    } catch (error) {
      console.error("Error executing automated response:", error);
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "Failed to execute automated response",
        variant: "destructive",
      });
    } finally {
      setProcessingAnomaly(null);
    }
  };

  if (anomalies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-green-600" />
            Anomaly Detection
          </CardTitle>
          <CardDescription>
            AI-powered detection of unusual patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>No anomalies detected - all activity appears normal</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-orange-600" />
          Anomaly Detection
          <Badge variant="destructive" className="ml-2">
            {anomalies.length} Alert{anomalies.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          Unusual patterns detected in audit logs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalies.map((anomaly) => {
          const Icon = getAnomalyIcon(anomaly.type);
          return (
            <Alert key={anomaly.id} className={getSeverityColor(anomaly.severity)}>
              <Icon className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                {anomaly.title}
                <Badge variant={getSeverityVariant(anomaly.severity)} className="ml-auto">
                  {anomaly.severity.toUpperCase()}
                </Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                {anomaly.description}
                
                {/* Additional metadata details */}
                <div className="mt-2 space-y-1 text-xs opacity-80">
                  {anomaly.type === 'user_activity' && anomaly.metadata.user && (
                    <div>User: <span className="font-mono">{anomaly.metadata.user}</span></div>
                  )}
                  {anomaly.metadata.percentage !== undefined && (
                    <div>Rate: <span className="font-semibold">{anomaly.metadata.percentage}%</span></div>
                  )}
                  {anomaly.metadata.ratio && (
                    <div>Ratio: <span className="font-semibold">{anomaly.metadata.ratio}x</span></div>
                  )}
                </div>

                {/* Action button */}
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant={anomaly.severity === 'high' ? 'destructive' : 'default'}
                    onClick={() => handleTakeAction(anomaly)}
                    disabled={processingAnomaly === anomaly.id}
                  >
                    {processingAnomaly === anomaly.id ? 'Processing...' : 'Take Automated Action'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
}
