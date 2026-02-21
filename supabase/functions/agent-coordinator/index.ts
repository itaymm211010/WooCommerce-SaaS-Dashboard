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

// Available agents
const AGENTS = {
  "sync-health": {
    name: "Sync Health Monitor",
    description: "Monitors sync errors, webhook failures, and data integrity",
    endpoint: "sync-health-agent",
  },
  // Future agents can be added here
  // "security-audit": { ... },
  // "bug-detection": { ... },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { task, agentType, context } = await req.json();

    console.log(`[Agent Coordinator] Task received:`, { task, agentType });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // If agent type is specified, route directly
    if (agentType && AGENTS[agentType as keyof typeof AGENTS]) {
      return await invokeAgent(agentType, task, context, req);
    }

    // Otherwise, use AI to determine the best agent
    if (!AI_SERVICE) {
      return new Response(
        JSON.stringify({
          error: "No AI API key configured (OPENROUTER_API_KEY or ANTHROPIC_API_KEY). Please specify agentType explicitly.",
          availableAgents: Object.keys(AGENTS),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`[Agent Coordinator] Using ${AI_SERVICE.toUpperCase()} to route task`);

    const routingPrompt = `You are an AI agent coordinator. Analyze this task and determine which agent should handle it.

Task: ${task}

Available agents:
${Object.entries(AGENTS)
  .map(([key, agent]) => `- ${key}: ${agent.description}`)
  .join("\n")}

Respond with ONLY a JSON object (no markdown):
{
  "agent": "agent-key",
  "reasoning": "brief explanation"
}`;

    let response;
    let routingText;

    if (AI_SERVICE === "openrouter") {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": SUPABASE_URL,
          "X-Title": "WooCommerce SaaS Dashboard",
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-5",
          messages: [
            {
              role: "user",
              content: routingPrompt,
            },
          ],
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      routingText = data.choices[0].message.content;
    } else {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 512,
          messages: [
            {
              role: "user",
              content: routingPrompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      routingText = data.content[0].text;
    }

    console.log("[Agent Coordinator] Routing response:", routingText);

    // Parse routing decision
    let routing;
    try {
      const jsonMatch = routingText.match(/\{[\s\S]*\}/);
      routing = JSON.parse(jsonMatch ? jsonMatch[0] : routingText);
    } catch (e) {
      console.error("[Agent Coordinator] Failed to parse routing decision", e);
      return new Response(
        JSON.stringify({
          error: "Failed to determine agent",
          rawResponse: routingText,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const selectedAgent = routing.agent;

    if (!AGENTS[selectedAgent as keyof typeof AGENTS]) {
      return new Response(
        JSON.stringify({
          error: `Invalid agent selected: ${selectedAgent}`,
          availableAgents: Object.keys(AGENTS),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`[Agent Coordinator] Routing to ${selectedAgent}: ${routing.reasoning}`);

    // Invoke the selected agent
    return await invokeAgent(selectedAgent, task, context, req);
  } catch (error) {
    console.error("[Agent Coordinator] Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function invokeAgent(
  agentType: string,
  task: string,
  context: any,
  originalReq: Request
) {
  const agent = AGENTS[agentType as keyof typeof AGENTS];

  if (!agent) {
    return new Response(
      JSON.stringify({
        error: `Agent not found: ${agentType}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      }
    );
  }

  console.log(`[Agent Coordinator] Invoking ${agent.name}`);

  // Call the agent's Edge Function
  const agentUrl = `${SUPABASE_URL}/functions/v1/${agent.endpoint}`;

  const agentResponse = await fetch(agentUrl, {
    method: "POST",
    headers: {
      Authorization: originalReq.headers.get("Authorization") || `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      task,
      context,
    }),
  });

  const agentData = await agentResponse.json();

  return new Response(
    JSON.stringify({
      agent: agentType,
      agentName: agent.name,
      result: agentData,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: agentResponse.status,
    }
  );
}
