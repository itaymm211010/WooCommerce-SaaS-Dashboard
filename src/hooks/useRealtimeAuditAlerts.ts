import { useEffect, createElement } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Shield } from "lucide-react";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_fields: string[] | null;
  user_email: string | null;
  created_at: string;
}

const CRITICAL_TABLES = ['stores', 'user_roles'];

function getAlertTitle(log: AuditLog): string {
  const tableLabel = log.table_name === 'stores' ? 'Store' : 'User Roles';
  
  switch (log.action) {
    case 'INSERT':
      return `🟢 New ${tableLabel} Created`;
    case 'UPDATE':
      return `🔵 ${tableLabel} Updated`;
    case 'DELETE':
      return `🔴 ${tableLabel} Deleted`;
    default:
      return `Critical Change in ${tableLabel}`;
  }
}

function getAlertDescription(log: AuditLog): string {
  const user = log.user_email || 'System';
  const table = log.table_name;
  
  if (log.action === 'UPDATE' && log.changed_fields) {
    const fields = log.changed_fields.slice(0, 3).join(', ');
    const more = log.changed_fields.length > 3 ? ` +${log.changed_fields.length - 3} more` : '';
    return `${user} modified ${fields}${more} in ${table}`;
  }
  
  return `${user} performed ${log.action} on ${table}`;
}

function getToastIcon(tableName: string) {
  return tableName === 'stores' ? Shield : AlertTriangle;
}

export function useRealtimeAuditAlerts() {
  useEffect(() => {
    console.log('🔔 Setting up realtime audit alerts...');

    const channel = supabase
      .channel('audit-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          const log = payload.new as AuditLog;
          
          console.log('📨 Received audit log:', log);

          // Only alert on critical tables
          if (!CRITICAL_TABLES.includes(log.table_name)) {
            console.log('⏭️ Skipping non-critical table:', log.table_name);
            return;
          }

          console.log('🚨 CRITICAL CHANGE DETECTED:', {
            table: log.table_name,
            action: log.action,
            user: log.user_email,
          });

          const Icon = getToastIcon(log.table_name);

          // Show toast notification
          toast(getAlertTitle(log), {
            description: getAlertDescription(log),
            icon: createElement(Icon, { className: "h-5 w-5" }),
            duration: 10000, // 10 seconds
            action: {
              label: 'View Details',
              onClick: () => {
                window.location.href = '/audit-logs';
              },
            },
            classNames: {
              toast: 'border-red-500 dark:border-red-900',
              title: 'font-semibold text-red-700 dark:text-red-400',
              description: 'text-red-600 dark:text-red-500',
            },
          });

          // Play notification sound (optional)
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
            audio.volume = 0.3;
            audio.play().catch(() => {
              // Ignore errors if audio playback fails
            });
          } catch (error) {
            // Ignore audio errors
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up realtime audit alerts...');
      supabase.removeChannel(channel);
    };
  }, []);
}
