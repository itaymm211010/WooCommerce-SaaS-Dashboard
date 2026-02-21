import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Determine which AI service to use
const AI_SERVICE = OPENROUTER_API_KEY ? "openrouter" : ANTHROPIC_API_KEY ? "anthropic" : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncError {
  id: string;
  store_id: string;
  entity_type: string;
  error_message: string;
  created_at: string;
  retry_count: number;
}

interface WebhookLog {
  id: string;
  store_id: string;
  event_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const executionId = crypto.randomUUID();
  const startTime = Date.now();

  console.log(`[Sync Health Agent] Execution ${executionId} started`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Log execution start
    await supabase.from("agent_execution_log").insert({
      id: executionId,
      agent_type: "sync_health",
      execution_type: "manual",
      status: "started",
      started_at: new Date().toISOString(),
    });

    // 1. Gather sync health data from last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: syncErrors, error: syncErrorsErr },
      { data: webhookLogs, error: webhookLogsErr },
      { data: syncLogs, error: syncLogsErr },
    ] = await Promise.all([
      supabase
        .from("sync_errors")
        .select("*")
        .gte("created_at", last24Hours)
        .order("created_at", { ascending: false }),
      supabase
        .from("webhook_logs")
        .select("*")
        .gte("created_at", last24Hours)
        .order("created_at", { ascending: false }),
      supabase
        .from("sync_logs")
        .select("*")
        .gte("created_at", last24Hours)
        .order("created_at", { ascending: false }),
    ]);

    if (syncErrorsErr || webhookLogsErr || syncLogsErr) {
      throw new Error("Failed to fetch sync data");
    }

    // 2. Calculate metrics
    const totalSyncs = syncLogs?.length || 0;
    const totalErrors = syncErrors?.length || 0;
    const errorRate = totalSyncs > 0 ? (totalErrors / totalSyncs) * 100 : 0;

    const webhookFailures = webhookLogs?.filter((log) => log.status === "failed") || [];
    const webhookFailureRate =
      webhookLogs && webhookLogs.length > 0
        ? (webhookFailures.length / webhookLogs.length) * 100
        : 0;

    // Group errors by type
    const errorsByType: Record<string, number> = {};
    syncErrors?.forEach((error: SyncError) => {
      errorsByType[error.entity_type] = (errorsByType[error.entity_type] || 0) + 1;
    });

    // Group errors by store
    const errorsByStore: Record<string, number> = {};
    syncErrors?.forEach((error: SyncError) => {
      errorsByStore[error.store_id] = (errorsByStore[error.store_id] || 0) + 1;
    });

    console.log(`[Sync Health Agent] Metrics calculated:`, {
      totalSyncs,
      totalErrors,
      errorRate: `${errorRate.toFixed(2)}%`,
      webhookFailureRate: `${webhookFailureRate.toFixed(2)}%`,
    });

    // 3. Analyze with AI if needed
    let insightId: string | null = null;
    let alertsGenerated = 0;

    if (!AI_SERVICE) {
      console.warn("[Sync Health Agent] No AI API key configured (OPENROUTER_API_KEY or ANTHROPIC_API_KEY), skipping AI analysis");
    } else if (errorRate > 5 || webhookFailureRate > 10 || totalErrors > 10) {
      console.log("[Sync Health Agent] Triggering AI analysis due to high error rates");

      const analysisPrompt = `You are the Sync Health Monitor Agent for a WooCommerce SaaS platform.

Analyze this sync health data from the last 24 hours:

## Metrics
- Total syncs: ${totalSyncs}
- Total errors: ${totalErrors}
- Error rate: ${errorRate.toFixed(2)}%
- Webhook failures: ${webhookFailures.length}
- Webhook failure rate: ${webhookFailureRate.toFixed(2)}%

## Errors by Entity Type
${JSON.stringify(errorsByType, null, 2)}

## Errors by Store
${JSON.stringify(errorsByStore, null, 2)}

## Recent Sync Errors (last 10)
${JSON.stringify(syncErrors?.slice(0, 10), null, 2)}

## Recent Webhook Failures (last 10)
${JSON.stringify(webhookFailures.slice(0, 10), null, 2)}

Please provide:
1. **Root Cause Analysis**: What's causing these errors?
2. **Pattern Detection**: Are there patterns by store, entity type, or time?
3. **Severity Assessment**: Rate as low/medium/high/critical
4. **Actionable Recommendations**: Specific fixes with file paths if possible
5. **Preventive Measures**: How to prevent this in the future

Format your response as JSON:
{
  "severity": "low|medium|high|critical",
  "rootCauses": ["cause 1", "cause 2"],
  "patterns": ["pattern 1", "pattern 2"],
  "recommendations": [
    {"action": "...", "file": "...", "priority": "high|medium|low"}
  ],
  "summary": "Brief summary of the situation"
}`;

      try {
        let aiResponse;
        let analysisText;

        if (AI_SERVICE === "openrouter") {
          console.log("[Sync Health Agent] Using OpenRouter API");
          aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": SUPABASE_URL, // Required by OpenRouter
              "X-Title": "WooCommerce SaaS Dashboard", // Optional, for rankings
            },
            body: JSON.stringify({
              model: "anthropic/claude-sonnet-4-5", // OpenRouter model format
              messages: [
                {
                  role: "system",
                  content: `You are a sync health monitoring specialist for WooCommerce ↔ Supabase integration.
Reference: .claude/architecture-context.md for sync strategy.
Your job is to identify issues, find root causes, and provide actionable solutions.`,
                },
                {
                  role: "user",
                  content: analysisPrompt,
                },
              ],
              max_tokens: 2048,
            }),
          });

          if (!aiResponse.ok) {
            throw new Error(`OpenRouter API error: ${aiResponse.statusText}`);
          }

          const openrouterData = await aiResponse.json();
          analysisText = openrouterData.choices[0].message.content;
        } else {
          // Anthropic API
          console.log("[Sync Health Agent] Using Anthropic API");
          aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": ANTHROPIC_API_KEY!,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-5-20250929",
              max_tokens: 2048,
              system: `You are a sync health monitoring specialist for WooCommerce ↔ Supabase integration.
Reference: .claude/architecture-context.md for sync strategy.
Your job is to identify issues, find root causes, and provide actionable solutions.`,
              messages: [
                {
                  role: "user",
                  content: analysisPrompt,
                },
              ],
            }),
          });

          if (!aiResponse.ok) {
            throw new Error(`Anthropic API error: ${aiResponse.statusText}`);
          }

          const anthropicData = await aiResponse.json();
          analysisText = anthropicData.content[0].text;
        }

        console.log("[Sync Health Agent] AI analysis completed");

        // Parse JSON response
        let analysis;
        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) ||
                           analysisText.match(/\{[\s\S]*\}/);
          const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText;
          analysis = JSON.parse(jsonStr);
        } catch (e) {
          console.error("[Sync Health Agent] Failed to parse AI response as JSON", e);
          analysis = {
            severity: errorRate > 20 ? "critical" : errorRate > 10 ? "high" : "medium",
            summary: analysisText.substring(0, 500),
            recommendations: [],
          };
        }

        // 4. Store insight
        const { data: insight, error: insightError } = await supabase
          .from("agent_insights")
          .insert({
            agent_type: "sync_health",
            analysis: analysisText,
            severity: analysis.severity || "medium",
            metadata: {
              totalSyncs,
              totalErrors,
              errorRate,
              webhookFailureRate,
              errorsByType,
              errorsByStore,
            },
            recommendations: analysis.recommendations || [],
            status: "new",
          })
          .select()
          .single();

        if (insightError) {
          console.error("[Sync Health Agent] Failed to store insight:", insightError);
        } else {
          insightId = insight.id;
          console.log(`[Sync Health Agent] Insight stored: ${insightId}`);
        }

        // 5. Create alert if critical or high severity
        if (analysis.severity === "critical" || analysis.severity === "high") {
          const { error: alertError } = await supabase.from("agent_alerts").insert({
            agent_type: "sync_health",
            title: `${analysis.severity.toUpperCase()}: Sync Health Issues Detected`,
            message: analysis.summary || `Error rate: ${errorRate.toFixed(2)}%, ${totalErrors} errors in last 24h`,
            severity: analysis.severity,
            insight_id: insightId,
            metadata: {
              errorRate,
              totalErrors,
              webhookFailureRate,
            },
          });

          if (!alertError) {
            alertsGenerated = 1;
            console.log("[Sync Health Agent] Alert created");
          }
        }
      } catch (aiError) {
        console.error("[Sync Health Agent] AI analysis failed:", aiError);
      }
    } else {
      console.log("[Sync Health Agent] No significant issues detected, skipping AI analysis");
    }

    // 6. Log execution completion
    const duration = Date.now() - startTime;
    await supabase
      .from("agent_execution_log")
      .update({
        status: "completed",
        duration_ms: duration,
        insights_generated: insightId ? 1 : 0,
        alerts_generated: alertsGenerated,
        completed_at: new Date().toISOString(),
      })
      .eq("id", executionId);

    console.log(`[Sync Health Agent] Execution ${executionId} completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        executionId,
        duration,
        metrics: {
          totalSyncs,
          totalErrors,
          errorRate: `${errorRate.toFixed(2)}%`,
          webhookFailureRate: `${webhookFailureRate.toFixed(2)}%`,
        },
        insightId,
        alertsGenerated,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[Sync Health Agent] Error:", error);

    // Log execution failure
    const duration = Date.now() - startTime;
    await supabase
      .from("agent_execution_log")
      .update({
        status: "failed",
        duration_ms: duration,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq("id", executionId);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        executionId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
