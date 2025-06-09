interface LogLevel {
  ERROR: 'ERROR';
  WARN: 'WARN';
  INFO: 'INFO';
  DEBUG: 'DEBUG';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

class DebugLogger {
  private static instance: DebugLogger;
  private logs: Array<{
    timestamp: string;
    level: string;
    component: string;
    message: string;
    data?: any;
  }> = [];
  private isDebugMode: boolean = __DEV__;

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createLogEntry(
    level: string,
    component: string,
    message: string,
    data?: any
  ) {
    const timestamp = this.formatTimestamp();
    const logEntry = { timestamp, level, component, message, data };

    // Store log entry
    this.logs.push(logEntry);

    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    return logEntry;
  }

  private shouldLog(level: string): boolean {
    if (!this.isDebugMode && level === LOG_LEVELS.DEBUG) {
      return false;
    }
    return true;
  }

  error(component: string, message: string, data?: any): void {
    const logEntry = this.createLogEntry(
      LOG_LEVELS.ERROR,
      component,
      message,
      data
    );
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(
        `[${logEntry.timestamp}] [${logEntry.level}] [${component}] ${message}`,
        data || ''
      );
    }
  }

  warn(component: string, message: string, data?: any): void {
    const logEntry = this.createLogEntry(
      LOG_LEVELS.WARN,
      component,
      message,
      data
    );
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(
        `[${logEntry.timestamp}] [${logEntry.level}] [${component}] ${message}`,
        data || ''
      );
    }
  }

  info(component: string, message: string, data?: any): void {
    const logEntry = this.createLogEntry(
      LOG_LEVELS.INFO,
      component,
      message,
      data
    );
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.log(
        `[${logEntry.timestamp}] [${logEntry.level}] [${component}] ${message}`,
        data || ''
      );
    }
  }

  debug(component: string, message: string, data?: any): void {
    const logEntry = this.createLogEntry(
      LOG_LEVELS.DEBUG,
      component,
      message,
      data
    );
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(
        `[${logEntry.timestamp}] [${logEntry.level}] [${component}] ${message}`,
        data || ''
      );
    }
  }

  // Get all stored logs
  getLogs(): Array<{
    timestamp: string;
    level: string;
    component: string;
    message: string;
    data?: any;
  }> {
    return [...this.logs];
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = [];
  }

  // Performance timing utilities
  startTimer(label: string): void {
    if (this.isDebugMode) {
      console.time(label);
    }
  }

  endTimer(label: string): void {
    if (this.isDebugMode) {
      console.timeEnd(label);
    }
  }

  // Memory usage tracking
  logMemoryUsage(component: string): void {
    if (this.isDebugMode && (global as any).performance?.memory) {
      const memory = (global as any).performance.memory;
      this.debug(component, 'Memory usage', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`
      });
    }
  }
}

// Export singleton instance
export const debugLogger = DebugLogger.getInstance();

// Convenience functions for easier usage
export const logError = (component: string, message: string, data?: any) =>
  debugLogger.error(component, message, data);

export const logWarn = (component: string, message: string, data?: any) =>
  debugLogger.warn(component, message, data);

export const logInfo = (component: string, message: string, data?: any) =>
  debugLogger.info(component, message, data);

export const logDebug = (component: string, message: string, data?: any) =>
  debugLogger.debug(component, message, data);

// Performance utilities
export const startTimer = (label: string) => debugLogger.startTimer(label);
export const endTimer = (label: string) => debugLogger.endTimer(label);

// Memory tracking
export const logMemoryUsage = (component: string) =>
  debugLogger.logMemoryUsage(component);

export default debugLogger;
