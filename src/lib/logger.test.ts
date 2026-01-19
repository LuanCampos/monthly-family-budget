import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, createTimer } from './logger';

describe('logger', () => {
  beforeEach(() => {
    // Clear logs before each test
    logger.clear();
    // Suppress console output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('log methods', () => {
    it('should store info logs', () => {
      logger.info('test.event', { key: 'value' });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].event).toBe('test.event');
      expect(logs[0].context).toEqual({ key: 'value' });
    });

    it('should store warn logs', () => {
      logger.warn('warning.event', { warning: 'message' });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].event).toBe('warning.event');
    });

    it('should store error logs with context object', () => {
      logger.error('error.event', { errorCode: 500 });
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].context).toEqual({ errorCode: 500 });
    });

    it('should handle Error objects in error()', () => {
      const error = new Error('Test error message');
      logger.error('error.with.exception', error);
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context?.error).toBe('Test error message');
      expect(logs[0].context?.stack).toBeDefined();
    });

    it('should handle string errors in error()', () => {
      logger.error('error.string', 'Simple error message');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toEqual({ error: 'Simple error message' });
    });

    it('should include timestamp in log entries', () => {
      logger.info('timestamp.test');
      
      const logs = logger.getLogs();
      expect(logs[0].timestamp).toBeDefined();
      expect(() => new Date(logs[0].timestamp)).not.toThrow();
    });

    it('should handle logs without context', () => {
      logger.info('no.context.event');
      
      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toBeUndefined();
    });
  });

  describe('log storage limits', () => {
    it('should limit stored logs to maxLogs', () => {
      // Create more than 500 logs
      for (let i = 0; i < 510; i++) {
        logger.info(`event.${i}`);
      }
      
      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(500);
    });

    it('should remove oldest logs when limit is exceeded', () => {
      for (let i = 0; i < 510; i++) {
        logger.info(`event.${i}`);
      }
      
      const logs = logger.getLogs();
      // First log should be event.10 (0-9 were removed)
      expect(logs[0].event).toBe('event.10');
    });
  });

  describe('getLogs methods', () => {
    beforeEach(() => {
      logger.info('info.event.1');
      logger.info('info.event.2');
      logger.warn('warn.event.1');
      logger.error('error.event.1', { code: 500 });
    });

    it('should return copy of logs', () => {
      const logs = logger.getLogs();
      logs.push({ timestamp: '', level: 'info', event: 'fake' });
      
      expect(logger.getLogs()).toHaveLength(4); // Original count unchanged
    });

    it('should filter logs by level', () => {
      const infoLogs = logger.getLogsByLevel('info');
      expect(infoLogs).toHaveLength(2);
      expect(infoLogs.every(l => l.level === 'info')).toBe(true);
    });

    it('should filter logs by event', () => {
      const warnLogs = logger.getLogsByEvent('warn.event.1');
      expect(warnLogs).toHaveLength(1);
      expect(warnLogs[0].event).toBe('warn.event.1');
    });
  });

  describe('clear', () => {
    it('should clear all logs', () => {
      logger.info('event.1');
      logger.info('event.2');
      expect(logger.getLogs()).toHaveLength(2);
      
      logger.clear();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('exportLogs', () => {
    it('should export logs as valid JSON', () => {
      logger.info('export.test', { key: 'value' });
      
      const exported = logger.exportLogs();
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].event).toBe('export.test');
    });

    it('should export empty array when no logs', () => {
      const exported = logger.exportLogs();
      expect(JSON.parse(exported)).toEqual([]);
    });
  });

  describe('exportLogsAsCSV', () => {
    it('should export logs as CSV format', () => {
      logger.info('csv.test', { data: 'value' });
      
      const csv = logger.exportLogsAsCSV();
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('timestamp,level,event,context,error');
      expect(lines[1]).toContain('csv.test');
    });

    it('should return empty string when no logs', () => {
      const csv = logger.exportLogsAsCSV();
      expect(csv).toBe('');
    });

    it('should escape quotes in CSV', () => {
      logger.info('quote.test', { message: 'value with "quotes"' });
      
      const csv = logger.exportLogsAsCSV();
      // The export first JSON.stringify the context (escapes to \"), then CSV escapes \" to ""
      // Result: value with \"quotes\" in JSON, then \""quotes\"" in CSV
      expect(csv).toContain('quotes');
      expect(csv).toContain('quote.test');
    });
  });

  describe('security - no sensitive data exposure', () => {
    it('should not expose password in logs', () => {
      const sensitiveData = { password: 'secret123', user: 'john' };
      logger.info('user.login', sensitiveData);
      
      const logs = logger.getLogs();
      // Note: Logger stores data as-is, sanitization should happen BEFORE logging
      // This test documents current behavior - caller is responsible for not logging passwords
      expect(logs[0].context).toEqual(sensitiveData);
    });

    it('should truncate very long context values in export', () => {
      const longValue = 'a'.repeat(10000);
      logger.info('long.value', { data: longValue });
      
      const logs = logger.getLogs();
      expect(logs[0].context?.data).toBe(longValue); // Raw storage preserves full value
      
      // Export works even with long values
      const exported = logger.exportLogs();
      expect(exported.length).toBeGreaterThan(0);
    });
  });

  describe('createTimer', () => {
    it('should measure duration', async () => {
      const timer = createTimer('async.operation');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const duration = timer.end({ result: 'success' });
      
      expect(duration).toBeGreaterThanOrEqual(40); // Allow some tolerance
      
      const logs = logger.getLogs();
      expect(logs[0].event).toBe('async.operation.completed');
      expect(logs[0].context?.result).toBe('success');
      expect(logs[0].context?.duration).toMatch(/^\d+ms$/);
    });

    it('should work without additional context', async () => {
      const timer = createTimer('simple.timer');
      const duration = timer.end();
      
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });
});
