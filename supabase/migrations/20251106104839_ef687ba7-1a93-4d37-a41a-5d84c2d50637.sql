-- AI Agent System Tables
-- This migration creates the infrastructure for autonomous AI agents

-- Agent Insights: Stores analysis results from AI agents
CREATE TABLE IF NOT EXISTS agent_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  analysis TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Alerts: High-priority notifications from agents
CREATE TABLE IF NOT EXISTS agent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  insight_id UUID REFERENCES agent_insights(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_by UUID REFERENCES auth.users(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Execution Log: Track when agents run
CREATE TABLE IF NOT EXISTS agent_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL,
  execution_type TEXT NOT NULL CHECK (execution_type IN ('scheduled', 'manual', 'triggered')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  duration_ms INTEGER,
  insights_generated INTEGER DEFAULT 0,
  alerts_generated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_insights_agent_type ON agent_insights(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_insights_severity ON agent_insights(severity);
CREATE INDEX IF NOT EXISTS idx_agent_insights_status ON agent_insights(status);
CREATE INDEX IF NOT EXISTS idx_agent_insights_created_at ON agent_insights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_alerts_severity ON agent_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_is_read ON agent_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_created_at ON agent_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_execution_log_agent_type ON agent_execution_log(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_execution_log_started_at ON agent_execution_log(started_at DESC);

-- RLS Policies
ALTER TABLE agent_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_execution_log ENABLE ROW LEVEL SECURITY;

-- Users can view all insights and alerts
CREATE POLICY "Users can view agent insights"
  ON agent_insights FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view agent alerts"
  ON agent_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view agent execution log"
  ON agent_execution_log FOR SELECT
  TO authenticated
  USING (true);

-- Users can update insights (acknowledge/resolve)
CREATE POLICY "Users can update agent insights"
  ON agent_insights FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Users can update alerts (mark as read)
CREATE POLICY "Users can update agent alerts"
  ON agent_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access to agent insights"
  ON agent_insights FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to agent alerts"
  ON agent_alerts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to agent execution log"
  ON agent_execution_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_agent_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_insights_updated_at
  BEFORE UPDATE ON agent_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_insights_updated_at();

-- Comments
COMMENT ON TABLE agent_insights IS 'Stores analysis results from AI agents';
COMMENT ON TABLE agent_alerts IS 'High-priority notifications from AI agents';
COMMENT ON TABLE agent_execution_log IS 'Tracks when AI agents execute and their results';