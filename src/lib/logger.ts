/**
 * Logger - Structured Logging
 *
 * Provides consistent, structured logging across the application
 * with support for different log levels and contextual information.
 *
 * Usage:
 *   logger.info('expense.created', { expenseId, familyId });
 *   logger.error('expense.failed', { error, payload });
 *   logger.debug('sync.start', { queueLength });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  context?: Record<string, any>;
  error?: Error | string;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 500; // Keep last 500 logs in memory

  /**
   * Log at debug level (development only)
   */
  debug(event: string, context?: Record<string, any>) {
    if (!this.isDev) return;
    this.log('debug', event, context);
  }

  /**
   * Log at info level
   */
  info(event: string, context?: Record<string, any>) {
    this.log('info', event, context);
  }

  /**
   * Log at warn level
   */
  warn(event: string, context?: Record<string, any>) {
    this.log('warn', event, context);
  }

  /**
   * Log at error level
   */
  error(event: string, context?: Record<string, any> | Error | string) {
    if (context instanceof Error) {
      this.log('error', event, { error: context.message, stack: context.stack });
    } else if (typeof context === 'string') {
      this.log('error', event, { error: context });
    } else {
      this.log('error', event, context);
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, event: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...(context && { context }),
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const prefix = `[${entry.timestamp}] ${level.toUpperCase()}: ${event}`;
    const style = this.getConsoleStyle(level);

    if (this.isDev && context) {
      console.log(`%c${prefix}`, style, context);
    } else if (!this.isDev && level !== 'debug') {
      console.log(`${prefix}`, context || '');
    }
  }

  /**
   * Get console styling for different log levels
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #888; font-weight: normal;',
      info: 'color: #0066cc; font-weight: bold;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold;',
    };
    return styles[level];
  }

  /**
   * Get all logged entries (useful for debugging)
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by event name
   */
  getLogsByEvent(event: string): LogEntry[] {
    return this.logs.filter(log => log.event === event);
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Export logs as JSON (useful for debugging)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportLogsAsCSV(): string {
    if (this.logs.length === 0) return '';

    const headers = ['timestamp', 'level', 'event', 'context', 'error'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level,
      log.event,
      JSON.stringify(log.context || {}),
      log.error || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Helper to measure operation duration
 * Usage:
 *   const timer = logger.timer('operation.name');
 *   await someAsyncOperation();
 *   timer.end({ result: 'success' }); // Logs duration automatically
 */
export const createTimer = (eventName: string) => {
  const startTime = performance.now();
  return {
    end: (context?: Record<string, any>) => {
      const duration = Math.round(performance.now() - startTime);
      logger.info(`${eventName}.completed`, {
        duration: `${duration}ms`,
        ...context,
      });
      return duration;
    },
  };
};
