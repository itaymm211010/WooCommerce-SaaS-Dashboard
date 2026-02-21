import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnomalyData {
  id: string;
  type: 'user_activity' | 'critical_spike' | 'high_frequency' | 'suspicious_pattern';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metadata: Record<string, any>;
  detectedAt: string;
}

interface HandleAnomalyRequest {
  anomaly: AnomalyData;
  actions: Array<'send_email' | 'suspend_user' | 'create_log'>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { anomaly, actions }: HandleAnomalyRequest = await req.json();

    console.log("Processing anomaly:", anomaly.id, "with actions:", actions);

    const results = [];

    // Process each action
    for (const actionType of actions) {
      try {
        if (actionType === 'send_email') {
          // Get admin users to send email to
          const { data: adminRoles, error: adminError } = await supabaseClient
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');

          if (adminError) throw adminError;

          const adminIds = adminRoles?.map(r => r.user_id) || [];
          
          // Get admin email addresses
          const { data: adminUsers, error: usersError } = await supabaseClient.auth.admin.listUsers();
          
          if (usersError) throw usersError;

          const adminEmails = adminUsers.users
            .filter(u => adminIds.includes(u.id))
            .map(u => u.email)
            .filter(Boolean) as string[];

          console.log("Sending emails to admins:", adminEmails);

          // Send email to each admin
          for (const email of adminEmails) {
            const emailResult = await resend.emails.send({
              from: "Security Alert <onboarding@resend.dev>",
              to: [email],
              subject: `🚨 Security Alert: ${anomaly.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">🚨 Security Alert</h1>
                  </div>
                  
                  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <div style="background: ${anomaly.severity === 'high' ? '#fee2e2' : '#fed7aa'}; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid ${anomaly.severity === 'high' ? '#dc2626' : '#ea580c'};">
                      <p style="margin: 0; font-weight: bold; color: ${anomaly.severity === 'high' ? '#991b1b' : '#9a3412'};">
                        ${anomaly.severity.toUpperCase()} SEVERITY
                      </p>
                    </div>
                    
                    <h2 style="color: #111827; margin-top: 0;">${anomaly.title}</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                      ${anomaly.description}
                    </p>
                    
                    <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
                      <h3 style="color: #374151; margin-top: 0; font-size: 14px; text-transform: uppercase;">Details</h3>
                      <table style="width: 100%; font-size: 14px; color: #6b7280;">
                        <tr>
                          <td style="padding: 8px 0;"><strong>Type:</strong></td>
                          <td style="padding: 8px 0;">${anomaly.type.replace('_', ' ').toUpperCase()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;"><strong>Detected At:</strong></td>
                          <td style="padding: 8px 0;">${new Date(anomaly.detectedAt).toLocaleString()}</td>
                        </tr>
                        ${anomaly.metadata.user ? `
                        <tr>
                          <td style="padding: 8px 0;"><strong>User:</strong></td>
                          <td style="padding: 8px 0; font-family: monospace;">${anomaly.metadata.user}</td>
                        </tr>
                        ` : ''}
                        ${anomaly.metadata.percentage ? `
                        <tr>
                          <td style="padding: 8px 0;"><strong>Rate:</strong></td>
                          <td style="padding: 8px 0;">${anomaly.metadata.percentage}%</td>
                        </tr>
                        ` : ''}
                      </table>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        This is an automated security alert from your Audit System.
                        Please review the audit logs immediately.
                      </p>
                    </div>
                  </div>
                </div>
              `,
            });

            console.log("Email sent to:", email, emailResult);
          }

          // Record action
          await supabaseClient
            .from('anomaly_response_actions')
            .insert({
              anomaly_id: anomaly.id,
              action_type: 'email_sent',
              target_email: adminEmails.join(', '),
              severity: anomaly.severity,
              metadata: { 
                recipientCount: adminEmails.length,
                emailsSent: adminEmails 
              },
              status: 'completed',
              completed_at: new Date().toISOString(),
            });

          results.push({ action: 'send_email', status: 'success', count: adminEmails.length });
        }

        if (actionType === 'suspend_user' && anomaly.metadata.user) {
          // Find user by email
          const { data: userData } = await supabaseClient.auth.admin.listUsers();
          const targetUser = userData?.users.find(u => u.email === anomaly.metadata.user);

          if (targetUser) {
            // Ban user temporarily (you can customize this logic)
            await supabaseClient.auth.admin.updateUserById(targetUser.id, {
              ban_duration: '24h', // Ban for 24 hours
            });

            console.log("User suspended:", targetUser.email);

            // Record action
            await supabaseClient
              .from('anomaly_response_actions')
              .insert({
                anomaly_id: anomaly.id,
                action_type: 'user_suspended',
                target_user_id: targetUser.id,
                target_email: targetUser.email,
                severity: anomaly.severity,
                metadata: { 
                  duration: '24h',
                  reason: anomaly.description 
                },
                status: 'completed',
                completed_at: new Date().toISOString(),
              });

            results.push({ action: 'suspend_user', status: 'success', userId: targetUser.id });
          } else {
            results.push({ action: 'suspend_user', status: 'failed', reason: 'User not found' });
          }
        }

        if (actionType === 'create_log') {
          // Create detailed log entry
          const logEntry = {
            anomaly_id: anomaly.id,
            action_type: 'log_created',
            severity: anomaly.severity,
            metadata: {
              anomaly: anomaly,
              timestamp: new Date().toISOString(),
              details: 'Detailed anomaly log for investigation',
            },
            status: 'completed',
            completed_at: new Date().toISOString(),
          };

          await supabaseClient
            .from('anomaly_response_actions')
            .insert(logEntry);

          console.log("Detailed log created for anomaly:", anomaly.id);
          results.push({ action: 'create_log', status: 'success' });
        }
      } catch (error) {
        console.error(`Error processing action ${actionType}:`, error);
        
        // Record failed action
        await supabaseClient
          .from('anomaly_response_actions')
          .insert({
            anomaly_id: anomaly.id,
            action_type: actionType,
            severity: anomaly.severity,
            metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          });

        results.push({ action: actionType, status: 'failed', error: error instanceof Error ? error.message : 'Unknown' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error handling anomaly response:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
