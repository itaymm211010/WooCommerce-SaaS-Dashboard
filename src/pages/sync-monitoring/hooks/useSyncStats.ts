import { useMemo } from "react";
import { startOfToday, startOfYesterday, endOfYesterday, startOfDay, format } from "date-fns";

interface SyncLog {
  id: string;
  created_at: string;
  status: string;
  duration_ms: number | null;
  store_id: string;
}

export const useSyncStats = (logs: SyncLog[] | undefined) => {
  return useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        totalSyncsToday: 0,
        totalSyncsYesterday: 0,
        errorRate: 0,
        avgDuration: 0,
        activeStores: 0,
        syncsByDay: []
      };
    }

    const today = startOfToday();
    const yesterday = startOfYesterday();
    const yesterdayEnd = endOfYesterday();

    // Total syncs today
    const totalSyncsToday = logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= today && log.status === 'success';
    }).length;

    // Total syncs yesterday
    const totalSyncsYesterday = logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= yesterday && logDate <= yesterdayEnd && log.status === 'success';
    }).length;

    // Error rate
    const totalLogs = logs.length;
    const failedLogs = logs.filter(log => log.status === 'failed').length;
    const errorRate = totalLogs > 0 ? (failedLogs / totalLogs) * 100 : 0;

    // Average duration
    const successfulLogs = logs.filter(log => log.status === 'success' && log.duration_ms);
    const avgDuration = successfulLogs.length > 0
      ? successfulLogs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / successfulLogs.length
      : 0;

    // Active stores today
    const activeStores = new Set(
      logs
        .filter(log => new Date(log.created_at) >= today)
        .map(log => log.store_id)
    ).size;

    // Syncs by day (last 7 days)
    const syncsByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= dayStart && logDate < dayEnd;
      });

      return {
        date: format(dayStart, 'MMM dd'),
        total: dayLogs.length,
        success: dayLogs.filter(log => log.status === 'success').length,
        failed: dayLogs.filter(log => log.status === 'failed').length
      };
    }).reverse();

    return {
      totalSyncsToday,
      totalSyncsYesterday,
      errorRate,
      avgDuration,
      activeStores,
      syncsByDay
    };
  }, [logs]);
};
