# AI Agent System

## Overview

The AI Agent System provides autonomous monitoring, analysis, and recommendations for the WooCommerce SaaS Dashboard. Agents run independently to analyze sync health, security, and system performance.

## Architecture

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Agent Coordinator   │ ← Routes requests to appropriate agents
└────────┬────────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌────────┐ ┌───────┐  ┌──────────┐
│ Sync   │ │Security│  │   Bug    │
│ Health │ │ Audit  │  │Detection │
└────────┘ └───────┘  └──────────┘
    │         │              │
    └─────────┴──────────────┘
              │
              ▼
    ┌──────────────────┐
    │  Agent Insights  │
    │  Agent Alerts    │
    │  Execution Log   │
    └──────────────────┘
```

## Available Agents

### 1. Sync Health Monitor (`sync-health-agent`)
**Purpose**: Monitor sync operations between WooCommerce and Supabase

**Triggers**:
- Manual execution via dashboard
- Scheduled (can be configured with cron)

**Analysis**:
- Error rate calculation
- Webhook failure detection
- Pattern analysis by store/entity type
- Root cause identification

**Output**:
- Insights with severity ratings
- Alerts for critical issues
- Actionable recommendations

**Example**:
```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/sync-health-agent \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### 2. Agent Coordinator (`agent-coordinator`)
**Purpose**: Route tasks to appropriate agents

**Usage**:
```typescript
// Automatic routing
const { data } = await supabase.functions.invoke('agent-coordinator', {
  body: {
    task: 'Analyze sync issues for store XYZ',
    // Agent coordinator will determine which agent to use
  }
});

// Explicit routing
const { data } = await supabase.functions.invoke('agent-coordinator', {
  body: {
    task: 'Check sync health',
    agentType: 'sync-health', // Force specific agent
  }
});
```

## Database Schema

### `agent_insights`
Stores analysis results from AI agents.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_type | TEXT | Type of agent (sync_health, security_audit, etc.) |
| analysis | TEXT | Full AI-generated analysis |
| severity | TEXT | low/medium/high/critical |
| metadata | JSONB | Context data (metrics, store_id, etc.) |
| recommendations | JSONB | List of actionable items |
| status | TEXT | new/acknowledged/in_progress/resolved/dismissed |
| created_at | TIMESTAMPTZ | When insight was generated |

### `agent_alerts`
High-priority notifications from agents.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_type | TEXT | Type of agent |
| title | TEXT | Alert title |
| message | TEXT | Alert message |
| severity | TEXT | low/medium/high/critical |
| insight_id | UUID | Reference to agent_insights |
| is_read | BOOLEAN | Whether user has seen it |
| created_at | TIMESTAMPTZ | When alert was created |

### `agent_execution_log`
Tracks when agents run and their results.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_type | TEXT | Type of agent |
| execution_type | TEXT | scheduled/manual/triggered |
| status | TEXT | started/completed/failed |
| duration_ms | INTEGER | How long execution took |
| insights_generated | INTEGER | Number of insights created |
| alerts_generated | INTEGER | Number of alerts created |
| started_at | TIMESTAMPTZ | When execution started |

## Configuration

### Environment Variables Required

```bash
# Option 1: Use OpenRouter (Recommended - cheaper, multiple models)
OPENROUTER_API_KEY=sk-or-v1-...

# Option 2: Use Anthropic directly
ANTHROPIC_API_KEY=sk-ant-...

# Already configured by Lovable
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Setting up AI API Key

**Option 1: OpenRouter (Recommended)**
1. Go to https://openrouter.ai/keys
2. Create a new API key
3. Go to Lovable Dashboard → Project Settings → Environment Variables
4. Add `OPENROUTER_API_KEY` with your key

**Benefits of OpenRouter:**
- ✅ Cheaper pricing (up to 50% less)
- ✅ Access to multiple models (Claude, GPT-4, Gemini, etc.)
- ✅ Same API for all models
- ✅ Easy credit management

**Option 2: Anthropic Direct**
1. Go to https://console.anthropic.com
2. Create API key
3. Go to Lovable Dashboard → Project Settings → Environment Variables
4. Add `ANTHROPIC_API_KEY` with your key

**Note:** The system will automatically use OpenRouter if `OPENROUTER_API_KEY` is set, otherwise it falls back to `ANTHROPIC_API_KEY`.

## Frontend Integration

The Agent Dashboard is available at `/agents` route.

**Features**:
- View recent insights and alerts
- Manual agent execution
- Execution history
- Real-time severity indicators

**Usage**:
```typescript
import { supabase } from "@/integrations/supabase/client";

// Run agent manually
const { data } = await supabase.functions.invoke('sync-health-agent');

// Fetch insights
const { data: insights } = await supabase
  .from('agent_insights')
  .select('*')
  .order('created_at', { ascending: false });

// Fetch alerts
const { data: alerts } = await supabase
  .from('agent_alerts')
  .select('*')
  .eq('is_read', false);
```

## Adding New Agents

### Step 1: Create Edge Function
```bash
mkdir supabase/functions/my-new-agent
```

### Step 2: Implement Agent Logic
```typescript
// supabase/functions/my-new-agent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // 1. Gather data
  // 2. Analyze with Claude (optional)
  // 3. Store insights
  // 4. Create alerts if needed
  // 5. Log execution
});
```

### Step 3: Register in Coordinator
```typescript
// supabase/functions/agent-coordinator/index.ts
const AGENTS = {
  // ... existing agents
  "my-new-agent": {
    name: "My New Agent",
    description: "What this agent does",
    endpoint: "my-new-agent",
  },
};
```

### Step 4: Deploy
```bash
git add .
git commit -m "feat: Add my-new-agent"
git push
# Lovable will auto-deploy
```

## Scheduling Agents

To run agents automatically on a schedule, add cron triggers:

```typescript
// supabase/functions/sync-health-agent/index.ts
Deno.cron("Sync Health Check", "0 */6 * * *", async () => {
  // Runs every 6 hours
  console.log("[Sync Health Agent] Scheduled execution started");
  // ... agent logic
});
```

## Best Practices

### 1. Always Log Execution
```typescript
const executionId = crypto.randomUUID();
await supabase.from("agent_execution_log").insert({
  id: executionId,
  agent_type: "my-agent",
  status: "started",
  started_at: new Date().toISOString(),
});
```

### 2. Set Appropriate Severity
- **critical**: System down, data loss risk
- **high**: Multiple failures, performance degradation
- **medium**: Isolated issues, minor impact
- **low**: Informational, no action needed

### 3. Provide Actionable Recommendations
```typescript
recommendations: [
  {
    action: "Update RLS policy on stores table",
    file: "supabase/migrations/...",
    priority: "high",
  }
]
```

### 4. Include Context in Metadata
```typescript
metadata: {
  store_id: "abc123",
  entity_type: "product",
  error_count: 10,
  time_range: "last_24h",
}
```

## Troubleshooting

### Agent not executing
1. Check Lovable Edge Function logs
2. Verify ANTHROPIC_API_KEY is set
3. Check RLS policies on agent tables
4. Ensure service role key has proper permissions

### No insights generated
1. Check if error thresholds are met
2. Verify AI analysis completed (check logs)
3. Ensure agent_insights table has proper permissions

### Alerts not showing
1. Check `is_read` filter
2. Verify severity levels
3. Check alert creation logic in agent

## Future Agents (Roadmap)

- **Security Audit Agent**: Review RLS policies, credential access
- **Bug Detection Agent**: Pattern analysis from error logs
- **Performance Monitor**: Track query performance, API latency
- **Cost Optimizer**: Analyze resource usage, suggest optimizations
- **Data Integrity Agent**: Detect orphaned records, inconsistencies

## Support

For issues or questions:
1. Check agent_execution_log for errors
2. Review Lovable Edge Function logs
3. Consult .claude/project-context.md
4. Open GitHub issue

---

**Last Updated**: 2025-11-06
**Version**: 1.0.0
