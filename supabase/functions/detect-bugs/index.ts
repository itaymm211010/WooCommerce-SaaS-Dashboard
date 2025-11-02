import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskLog {
  id: string;
  task_id?: string;
  level: string;
  message: string;
  stack_trace?: string;
  context?: any;
  file_path?: string;
  created_at: string;
}

interface BugReport {
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical' | 'blocker';
  affected_files?: string[];
  steps_to_reproduce?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting automatic bug detection...');

    // Get recent error logs from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: errorLogs, error: logsError } = await supabase
      .from('task_logs')
      .select('*')
      .in('level', ['error', 'critical'])
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      throw logsError;
    }

    console.log(`Found ${errorLogs?.length || 0} error logs`);

    // Group errors by message similarity
    const errorGroups = new Map<string, TaskLog[]>();
    
    errorLogs?.forEach((log: TaskLog) => {
      // Extract error message without stack trace details
      const errorKey = log.message.split('\n')[0].slice(0, 100);
      
      if (!errorGroups.has(errorKey)) {
        errorGroups.set(errorKey, []);
      }
      errorGroups.get(errorKey)!.push(log);
    });

    console.log(`Grouped into ${errorGroups.size} unique error types`);

    // Create bug reports for recurring errors (3+ occurrences)
    const bugsCreated: BugReport[] = [];
    
    for (const [errorKey, logs] of errorGroups.entries()) {
      if (logs.length < 3) continue; // Only create bug reports for recurring issues

      // Check if bug report already exists for this error
      const { data: existingBug } = await supabase
        .from('bug_reports')
        .select('id')
        .ilike('title', `%${errorKey.slice(0, 50)}%`)
        .single();

      if (existingBug) {
        console.log(`Bug report already exists for: ${errorKey}`);
        continue;
      }

      // Determine severity based on frequency and level
      const criticalCount = logs.filter(l => l.level === 'critical').length;
      const frequency = logs.length;
      
      let severity: 'minor' | 'moderate' | 'major' | 'critical' | 'blocker';
      if (criticalCount > 0 || frequency > 20) {
        severity = 'blocker';
      } else if (frequency > 10) {
        severity = 'critical';
      } else if (frequency > 5) {
        severity = 'major';
      } else {
        severity = 'moderate';
      }

      // Collect affected files
      const affectedFiles = [...new Set(
        logs
          .map(l => l.file_path)
          .filter(Boolean)
      )] as string[];

      // Get context from logs
      const contexts = logs.map(l => l.context).filter(Boolean);
      
      const bugReport: BugReport = {
        title: `[Auto-Detected] ${errorKey}`,
        description: `Recurring error detected: ${logs[0].message}\n\n` +
                    `Occurred ${frequency} times in the last 24 hours.\n\n` +
                    `First occurrence: ${logs[logs.length - 1].created_at}\n` +
                    `Latest occurrence: ${logs[0].created_at}\n\n` +
                    `Stack trace:\n${logs[0].stack_trace || 'No stack trace available'}`,
        severity,
        affected_files: affectedFiles.length > 0 ? affectedFiles : undefined,
        steps_to_reproduce: contexts.length > 0 
          ? `Context from logs:\n${JSON.stringify(contexts[0], null, 2)}`
          : undefined
      };

      // Insert bug report
      const { error: insertError } = await supabase
        .from('bug_reports')
        .insert({
          ...bugReport,
          status: 'open',
          reporter_id: null // Auto-detected, no specific reporter
        });

      if (insertError) {
        console.error('Error creating bug report:', insertError);
        continue;
      }

      bugsCreated.push(bugReport);
      console.log(`Created bug report: ${bugReport.title}`);

      // Create alert for critical/blocker bugs
      if (severity === 'critical' || severity === 'blocker') {
        await supabase
          .from('project_alerts')
          .insert({
            type: 'bug_critical',
            severity: severity === 'blocker' ? 'critical' : 'high',
            message: `Critical bug detected: ${errorKey.slice(0, 100)} (${frequency} occurrences)`
          });
      }
    }

    console.log(`Bug detection complete. Created ${bugsCreated.length} bug reports`);

    return new Response(
      JSON.stringify({
        success: true,
        errors_analyzed: errorLogs?.length || 0,
        unique_errors: errorGroups.size,
        bugs_created: bugsCreated.length,
        bugs: bugsCreated
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in detect-bugs function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});