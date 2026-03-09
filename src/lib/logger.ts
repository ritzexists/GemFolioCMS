/**
 * Logger Utility
 * 
 * A simple logging utility that supports different log levels and environment-based
 * output. In development, it logs to the console with colors. In production,
 * it could be extended to send logs to a remote service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private isDev: boolean;

  private constructor() {
    this.isDev = import.meta.env.DEV;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  private print(entry: LogEntry) {
    const { timestamp, level, message, data } = entry;
    const style = this.getStyle(level);
    
    if (this.isDev) {
      console.log(
        `%c[${timestamp}] [${level.toUpperCase()}] ${message}`,
        style,
        data || ''
      );
    } else {
      // In production, we might want to just log the object or send to a service
      if (level === 'error') {
        console.error(entry);
      } else if (level === 'warn') {
        console.warn(entry);
      } else {
        console.log(entry);
      }
    }
  }

  private getStyle(level: LogLevel): string {
    switch (level) {
      case 'debug': return 'color: #9ca3af'; // gray
      case 'info': return 'color: #3b82f6'; // blue
      case 'warn': return 'color: #f59e0b'; // orange
      case 'error': return 'color: #ef4444; font-weight: bold'; // red
      default: return 'color: inherit';
    }
  }

  public debug(message: string, data?: any) {
    this.print(this.formatMessage('debug', message, data));
  }

  public info(message: string, data?: any) {
    this.print(this.formatMessage('info', message, data));
  }

  public warn(message: string, data?: any) {
    this.print(this.formatMessage('warn', message, data));
  }

  public error(message: string, data?: any) {
    this.print(this.formatMessage('error', message, data));
  }
}

export const logger = Logger.getInstance();
