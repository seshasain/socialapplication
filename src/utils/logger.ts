import config from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

interface LoggerOptions {
  maxEntries?: number;
  persistLogs?: boolean;
  remoteLogging?: boolean;
  filterLevel?: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;
  private options: LoggerOptions;

  private constructor() {
    this.options = {
      maxEntries: 1000,
      persistLogs: true,
      remoteLogging: config.isProduction(),
      filterLevel: config.isDevelopment() ? 'debug' : 'info'
    };

    if (this.options.persistLogs) {
      this.loadPersistedLogs();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleUncaughtError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.options.filterLevel!]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.logs.push(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    const styles = {
      debug: 'color: gray',
      info: 'color: blue',
      warn: 'color: orange',
      error: 'color: red; font-weight: bold'
    };

    if (import.meta.env.DEV) {
      console.log(
        `%c${entry.timestamp} [${level.toUpperCase()}] ${message}`,
        styles[level]
      );
      if (data) {
        console.log(data);
      }
    }

    if (this.options.persistLogs) {
      this.persistLogs();
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | any) {
    this.log('error', message, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });
  }

  handleUncaughtError = (event: ErrorEvent) => {
    this.error(
      'Uncaught error',
      event.error
    );
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.error(
      'Unhandled promise rejection',
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    );
  };

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

  getLogs(level?: LogLevel): LogEntry[] {
    return level 
      ? this.logs.filter(log => log.level === level)
      : this.logs;
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

export const logger = Logger.getInstance();
export default logger; 