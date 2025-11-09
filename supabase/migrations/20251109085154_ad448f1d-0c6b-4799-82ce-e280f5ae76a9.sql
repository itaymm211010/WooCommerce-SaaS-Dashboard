-- ============================================================================
-- Fix Project Management RLS Policies - Restrict Visibility
-- ============================================================================
-- Issue: All project management tables are visible to all authenticated users
-- Solution: Restrict visibility to only relevant users (assigned, created by, or admins)
-- ============================================================================

-- ============================================================================
-- 1. BUG REPORTS - Critical: Security vulnerabilities exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all bug reports" ON bug_reports;

CREATE POLICY "Users can view relevant bug reports" 
ON bug_reports 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.uid() = assigned_to 
  OR auth.uid() = reporter_id
);

-- ============================================================================
-- 2. TASKS - Internal work details exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;

CREATE POLICY "Users can view relevant tasks" 
ON tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.uid() = assigned_to 
  OR auth.uid() = created_by
);

-- ============================================================================
-- 3. SPRINTS - Project planning exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all sprints" ON sprints;

CREATE POLICY "Users can view relevant sprints" 
ON sprints 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.sprint_id = sprints.id 
    AND (tasks.assigned_to = auth.uid() OR tasks.created_by = auth.uid())
  )
);

-- ============================================================================
-- 4. WORK LOGS - Employee time tracking exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all work logs" ON work_logs;

CREATE POLICY "Users can view own work logs" 
ON work_logs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.uid() = user_id
);

-- ============================================================================
-- 5. TASK COMMENTS - Private discussions exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all comments" ON task_comments;

CREATE POLICY "Users can view relevant task comments" 
ON task_comments 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_comments.task_id 
    AND (tasks.assigned_to = auth.uid() OR tasks.created_by = auth.uid())
  )
);

-- ============================================================================
-- 6. DEPLOYMENTS - Git commits and infrastructure exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all deployments" ON deployments;

CREATE POLICY "Admins can view deployments" 
ON deployments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 7. PROJECT ALERTS - System issues exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all alerts" ON project_alerts;

CREATE POLICY "Admins can view project alerts" 
ON project_alerts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 8. TASK LOGS - System logs and errors exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view all logs" ON task_logs;

CREATE POLICY "Users can view relevant task logs" 
ON task_logs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM tasks 
    WHERE tasks.id = task_logs.task_id 
    AND (tasks.assigned_to = auth.uid() OR tasks.created_by = auth.uid())
  )
);

-- ============================================================================
-- 9. AGENT EXECUTION LOG - AI operations exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view agent execution log" ON agent_execution_log;

CREATE POLICY "Admins can view agent execution log" 
ON agent_execution_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 10. AGENT INSIGHTS - Business analysis exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view agent insights" ON agent_insights;

CREATE POLICY "Admins can view agent insights" 
ON agent_insights 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 11. AGENT ALERTS - AI-generated alerts exposed
-- ============================================================================
DROP POLICY IF EXISTS "Users can view agent alerts" ON agent_alerts;

CREATE POLICY "Admins can view agent alerts" 
ON agent_alerts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- Add helpful comments
-- ============================================================================
COMMENT ON POLICY "Users can view relevant bug reports" ON bug_reports IS 
  'Security: Users can only see bugs they reported or are assigned to, plus admins see all';

COMMENT ON POLICY "Users can view relevant tasks" ON tasks IS 
  'Security: Users can only see tasks they created or are assigned to, plus admins see all';

COMMENT ON POLICY "Users can view relevant sprints" ON sprints IS 
  'Security: Users can only see sprints they created or have tasks in, plus admins see all';

COMMENT ON POLICY "Users can view own work logs" ON work_logs IS 
  'Security: Users can only see their own time tracking, plus admins see all';

COMMENT ON POLICY "Users can view relevant task comments" ON task_comments IS 
  'Security: Users can only see comments on tasks they are involved with, plus admins see all';

COMMENT ON POLICY "Admins can view deployments" ON deployments IS 
  'Security: Only admins can view deployment history and git commits';

COMMENT ON POLICY "Admins can view project alerts" ON project_alerts IS 
  'Security: Only admins can view system alerts';

COMMENT ON POLICY "Users can view relevant task logs" ON task_logs IS 
  'Security: Users can only see logs for tasks they are involved with, plus admins see all';

COMMENT ON POLICY "Admins can view agent execution log" ON agent_execution_log IS 
  'Security: Only admins can view AI agent execution details';

COMMENT ON POLICY "Admins can view agent insights" ON agent_insights IS 
  'Security: Only admins can view AI-generated business insights';

COMMENT ON POLICY "Admins can view agent alerts" ON agent_alerts IS 
  'Security: Only admins can view AI-generated alerts';