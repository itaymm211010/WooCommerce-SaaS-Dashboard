import { useMemo } from "react";

interface AuditStats {
  totalChanges: number;
  criticalChanges: number;
  highPriorityChanges: number;
  uniqueUsers: number;
  timeSeriesData: Array<{ date: string; count: number; inserts: number; updates: number; deletes: number }>;
  userActivityData: Array<{ user_email: string; total_changes: number; inserts: number; updates: number; deletes: number }>;
  tableDistribution: Array<{ table_name: string; count: number; severity: string }>;
  recentTrends: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
}

export interface Anomaly {
  id: string;
  type: 'user_activity' | 'critical_spike' | 'high_frequency' | 'suspicious_pattern';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metadata: Record<string, any>;
  detectedAt: Date;
}

export function useAnomalyDetection(stats: AuditStats | undefined, period: number) {
  const anomalies = useMemo<Anomaly[]>(() => {
    if (!stats) return [];

    const detected: Anomaly[] = [];
    const now = new Date();

    // 1. Detect unusual user activity (user doing 3x more than average)
    if (stats.userActivityData.length > 0) {
      const avgChangesPerUser = stats.totalChanges / stats.uniqueUsers;
      const threshold = avgChangesPerUser * 3;

      stats.userActivityData.forEach(user => {
        if (user.total_changes > threshold && user.total_changes > 50) {
          detected.push({
            id: `user-activity-${user.user_email}`,
            type: 'user_activity',
            severity: user.total_changes > threshold * 2 ? 'high' : 'medium',
            title: 'Unusual User Activity Detected',
            description: `User ${user.user_email} performed ${user.total_changes} changes (${Math.round(user.total_changes / avgChangesPerUser)}x above average)`,
            metadata: {
              user: user.user_email,
              changes: user.total_changes,
              average: Math.round(avgChangesPerUser),
              ratio: (user.total_changes / avgChangesPerUser).toFixed(1),
            },
            detectedAt: now,
          });
        }
      });
    }

    // 2. Detect critical changes spike (comparing periods)
    const criticalRatio = stats.totalChanges > 0 ? stats.criticalChanges / stats.totalChanges : 0;
    if (criticalRatio > 0.15) { // More than 15% critical changes
      detected.push({
        id: 'critical-spike',
        type: 'critical_spike',
        severity: criticalRatio > 0.25 ? 'high' : 'medium',
        title: 'High Critical Changes Rate',
        description: `${Math.round(criticalRatio * 100)}% of changes are critical (stores, user_roles)`,
        metadata: {
          criticalChanges: stats.criticalChanges,
          totalChanges: stats.totalChanges,
          percentage: Math.round(criticalRatio * 100),
        },
        detectedAt: now,
      });
    }

    // 3. Detect sudden activity spike in recent days
    const recentAvg = stats.recentTrends.last7Days / 7;
    const periodAvg = stats.totalChanges / period;
    
    if (recentAvg > periodAvg * 2.5 && stats.recentTrends.last7Days > 100) {
      detected.push({
        id: 'high-frequency',
        type: 'high_frequency',
        severity: recentAvg > periodAvg * 4 ? 'high' : 'medium',
        title: 'Sudden Activity Spike',
        description: `Recent activity is ${(recentAvg / periodAvg).toFixed(1)}x higher than period average`,
        metadata: {
          recentDailyAvg: Math.round(recentAvg),
          periodDailyAvg: Math.round(periodAvg),
          last7Days: stats.recentTrends.last7Days,
        },
        detectedAt: now,
      });
    }

    // 4. Detect suspicious patterns (high delete operations)
    if (stats.timeSeriesData.length > 0) {
      const totalDeletes = stats.timeSeriesData.reduce((sum, day) => sum + day.deletes, 0);
      const deleteRatio = stats.totalChanges > 0 ? totalDeletes / stats.totalChanges : 0;

      if (deleteRatio > 0.2) { // More than 20% deletes
        detected.push({
          id: 'suspicious-deletes',
          type: 'suspicious_pattern',
          severity: deleteRatio > 0.3 ? 'high' : 'medium',
          title: 'High Deletion Activity',
          description: `${Math.round(deleteRatio * 100)}% of changes are deletions`,
          metadata: {
            deletes: totalDeletes,
            totalChanges: stats.totalChanges,
            percentage: Math.round(deleteRatio * 100),
          },
          detectedAt: now,
        });
      }
    }

    // Sort by severity
    return detected.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [stats, period]);

  return { anomalies };
}
