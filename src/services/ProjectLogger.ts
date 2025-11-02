import { supabase } from "@/integrations/supabase/client";

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';

interface LogOptions {
  taskId?: string;
  filePath?: string;
  lineNumber?: number;
  context?: Record<string, any>;
  stackTrace?: string;
}

class ProjectLogger {
  private static instance: ProjectLogger;
  private userId: string | null = null;

  private constructor() {
    this.initializeUser();
  }

  static getInstance(): ProjectLogger {
    if (!ProjectLogger.instance) {
      ProjectLogger.instance = new ProjectLogger();
    }
    return ProjectLogger.instance;
  }

  private async initializeUser() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
  }

  private async log(
    level: LogLevel,
    message: string,
    options: LogOptions = {}
  ): Promise<void> {
    try {
      // Always log to console
      const consoleMethod = level === 'critical' || level === 'error' ? 'error' : 
                           level === 'warning' ? 'warn' : 
                           level === 'debug' ? 'debug' : 'log';
      
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, options.context);

      // Ensure we have user ID
      if (!this.userId) {
        await this.initializeUser();
      }

      // Insert into database
      const { error } = await supabase
        .from('task_logs')
        .insert({
          level,
          message,
          task_id: options.taskId || null,
          file_path: options.filePath || null,
          line_number: options.lineNumber || null,
          context: options.context || {},
          stack_trace: options.stackTrace || null,
          user_id: this.userId
        });

      if (error) {
        console.error('Failed to save log to database:', error);
      }
    } catch (error) {
      console.error('Logger error:', error);
    }
  }

  debug(message: string, options?: LogOptions): Promise<void> {
    return this.log('debug', message, options);
  }

  info(message: string, options?: LogOptions): Promise<void> {
    return this.log('info', message, options);
  }

  warning(message: string, options?: LogOptions): Promise<void> {
    return this.log('warning', message, options);
  }

  error(message: string, error?: Error, options?: LogOptions): Promise<void> {
    return this.log('error', message, {
      ...options,
      stackTrace: error?.stack,
      context: {
        ...options?.context,
        errorName: error?.name,
        errorMessage: error?.message
      }
    });
  }

  critical(message: string, error?: Error, options?: LogOptions): Promise<void> {
    return this.log('critical', message, {
      ...options,
      stackTrace: error?.stack,
      context: {
        ...options?.context,
        errorName: error?.name,
        errorMessage: error?.message
      }
    });
  }

  // Helper to automatically detect file path from error stack
  static extractFileInfo(error: Error): { filePath?: string; lineNumber?: number } {
    if (!error.stack) return {};

    const stackLines = error.stack.split('\n');
    const relevantLine = stackLines.find(line => line.includes('src/'));
    
    if (!relevantLine) return {};

    const match = relevantLine.match(/\((.*?):(\d+):\d+\)/);
    if (match) {
      return {
        filePath: match[1],
        lineNumber: parseInt(match[2], 10)
      };
    }

    return {};
  }
}

// Export singleton instance
export const logger = ProjectLogger.getInstance();

// Global error handler to automatically log uncaught errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const fileInfo = ProjectLogger.extractFileInfo(event.error);
    logger.critical('Uncaught error', event.error, {
      ...fileInfo,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.critical('Unhandled promise rejection', 
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    );
  });
}