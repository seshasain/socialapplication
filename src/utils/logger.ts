import config from './config';
import { performanceMonitor } from './performance';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'api' | 'auth' | 'ui' | 'performance' | 'analytics' | 'system';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  error?: Error;
  context?: Record<string, any>;
}

interface LoggerOptions {
  maxEntries?: number;
  persistLogs?: boolean;
  remoteLogging?: boolean;
  filterLevel?: LogLevel;
  categories?: LogCategory[];
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  private logs: LogEntry[] = [];
  private options: LoggerOptions;
  private remoteEndpoint?: string;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      maxEntries: 1000,
      persistLogs: true,
      remoteLogging: config.isProduction(),
      filterLevel: config.isDevelopment() ? 'debug' : 'info',
      categories: ['api', 'auth', 'ui', 'performance', 'analytics', 'system'],
      ...options
    };

    if (this.options.persistLogs) {
      this.loadPersistedLogs();
    }

    if (this.options.remoteLogging) {
      this.remoteEndpoint = config.get('logging.remoteEndpoint');
    }

    // Handle uncaught errors
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  debug(message: string, category: LogCategory = 'system', data?: any) {
    this.log('debug', message, category, data);
  }

  info(message: string, category: LogCategory = 'system', data?: any) {
    this.log('info', message, category, data);
  }

  warn(message: string, category: LogCategory = 'system', data?: any) {
    this.log('warn', message, category, data);
  }

  error(message: string, category: LogCategory = 'system', error?: Error, data?: any) {
    this.log('error', message, category, data, error);
  }

  private log(
    level: LogLevel,
    message: string,
    category: LogCategory,
    data?: any,
    error?: Error
  ) {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.options.filterLevel!]) {
      return;
    }

    if (this.options.categories && !this.options.categories.includes(category)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error,
      context: this.getContext()
    };

    this.addEntry(entry);
    this.outputToConsole(entry);

    if (this.options.remoteLogging && LOG_LEVELS[level] >= LOG_LEVELS.error) {
      this.sendToRemote(entry);
    }
  }

  private addEntry(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.options.maxEntries!) {
      this.logs = this.logs.slice(-this.options.maxEntries!);
    }

    if (this.options.persistLogs) {
      this.persistLogs();
    }
  }

  private outputToConsole(entry: LogEntry) {
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] [${entry.category.toUpperCase()}] [${entry.level.toUpperCase()}]`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(prefix, entry.message, entry.data || '');
        break;
      case 'info':
        console.info(prefix, entry.message, entry.data || '');
        break;
      case 'warn':
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case 'error':
        console.error(prefix, entry.message, entry.error || '', entry.data || '');
        break;
    }
  }

  private async sendToRemote(entry: LogEntry) {
    if (!this.remoteEndpoint) return;

    try {
      const response = await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        console.error('Failed to send log to remote endpoint:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send log to remote endpoint:', error);
    }
  }

  private getContext(): Record<string, any> {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      environment: config.getEnvironment(),
      performance: performanceMonitor.generateReport()
    };
  }

  private handleGlobalError(event: ErrorEvent) {
    this.error(
      'Uncaught error',
      'system',
      event.error,
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    this.error(
      'Unhandled promise rejection',
      'system',
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    );
  }

  private persistLogs() {
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-100)));
    } catch (error) {
      console.warn('Failed to persist logs:', error);
    }
  }

  private loadPersistedLogs() {
    try {
      const persistedLogs = localStorage.getItem('app_logs');
      if (persistedLogs) {
        this.logs = JSON.parse(persistedLogs);
      }
    } catch (error) {
      console.warn('Failed to load persisted logs:', error);
    }
  }

  getLogs(
    options: {
      level?: LogLevel;
      category?: LogCategory;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
    } = {}
  ): LogEntry[] {
    let filtered = this.logs;

    if (options.level) {
      filtered = filtered.filter(log => log.level === options.level);
    }
    if (options.category) {
      filtered = filtered.filter(log => log.category === options.category);
    }
    if (options.startTime) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= options.startTime!);
    }
    if (options.endTime) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= options.endTime!);
    }
    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  clearLogs() {
    this.logs = [];
    if (this.options.persistLogs) {
      localStorage.removeItem('app_logs');
    }
  }

  setOptions(options: Partial<LoggerOptions>) {
    this.options = {
      ...this.options,
      ...options
    };
  }

  getStats(): Record<string, number> {
    return {
      total: this.logs.length,
      debug: this.logs.filter(log => log.level === 'debug').length,
      info: this.logs.filter(log => log.level === 'info').length,
      warn: this.logs.filter(log => log.level === 'warn').length,
      error: this.logs.filter(log => log.level === 'error').length
    };
  }
}

export const logger = new Logger();
export default logger; 