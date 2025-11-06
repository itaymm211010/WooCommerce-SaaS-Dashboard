import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, AlertTriangle, CheckCircle2, Clock, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentInsight {
  id: string;
  agent_type: string;
  analysis: string;
  severity: string;
  metadata: any;
  recommendations: any[];
  status: string;
  created_at: string;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  resolved_at?: string | null;
  updated_at: string;
}

interface AgentAlert {
  id: string;
  agent_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
  insight_id?: string | null;
  metadata?: any;
  read_at?: string | null;
  read_by?: string | null;
}

interface AgentExecution {
  id: string;
  agent_type: string;
  status: string;
  duration_ms: number;
  insights_generated: number;
  alerts_generated: number;
  started_at: string;
  completed_at: string;
  execution_type?: string;
  error_message?: string | null;
  metadata?: any;
}

export default function AgentDashboard() {
  const [insights, setInsights] = useState<AgentInsight[]>([]);
  const [alerts, setAlerts] = useState<AgentAlert[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const [insightsRes, alertsRes, executionsRes] = await Promise.all([
        supabase
          .from("agent_insights")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("agent_alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("agent_execution_log")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(10),
      ]);

      if (insightsRes.data) setInsights(insightsRes.data as any);
      if (alertsRes.data) setAlerts(alertsRes.data as any);
      if (executionsRes.data) setExecutions(executionsRes.data as any);
    } catch (error) {
      console.error("Failed to load agent data:", error);
      toast({
        title: "Error",
        description: "Failed to load agent data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSyncHealthAgent = async () => {
    setIsExecuting(true);

    try {
      const { data, error } = await supabase.functions.invoke("sync-health-agent", {
        body: {},
      });

      if (error) throw error;

      toast({
        title: "Agent Executed",
        description: `Sync Health Agent completed in ${data.duration}ms`,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Failed to execute agent:", error);
      toast({
        title: "Error",
        description: "Failed to execute agent",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getAgentIcon = (agentType: string) => {
    return <Bot className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Agent Dashboard</h1>
          <p className="text-muted-foreground">
            Autonomous agents monitoring your WooCommerce sync operations
          </p>
        </div>
        <Button onClick={runSyncHealthAgent} disabled={isExecuting}>
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Sync Health Check
            </>
          )}
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Alerts
            </CardTitle>
            <CardDescription>Issues that require attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{alert.agent_type}</span>
                  </div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Recent Insights
          </CardTitle>
          <CardDescription>AI-generated analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No insights yet. Run an agent to generate analysis.
            </p>
          ) : (
            insights.map((insight) => (
              <div key={insight.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAgentIcon(insight.agent_type)}
                    <span className="font-medium">{insight.agent_type}</span>
                    <Badge variant={getSeverityColor(insight.severity)}>
                      {insight.severity}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(insight.created_at).toLocaleString()}
                  </span>
                </div>

                {insight.metadata && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
                    {Object.entries(insight.metadata).map(([key, value]) => {
                      if (typeof value === "object") return null;
                      return (
                        <div key={key} className="text-sm">
                          <span className="text-muted-foreground">{key}: </span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-muted p-3 rounded text-sm max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {insight.analysis.substring(0, 500)}
                    {insight.analysis.length > 500 && "..."}
                  </pre>
                </div>

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <h5 className="text-sm font-semibold">Recommendations:</h5>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      {insight.recommendations.map((rec: any, idx: number) => (
                        <li key={idx}>{rec.action || JSON.stringify(rec)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Execution History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Execution History
          </CardTitle>
          <CardDescription>Recent agent executions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {executions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No executions yet</p>
            ) : (
              executions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex items-center gap-3">
                    {execution.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : execution.status === "failed" ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                    <div>
                      <span className="font-medium">{execution.agent_type}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {execution.duration_ms}ms
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{execution.insights_generated} insights</span>
                    <span>{execution.alerts_generated} alerts</span>
                    <span className="text-muted-foreground">
                      {new Date(execution.started_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
