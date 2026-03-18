/**
 * Logger service abstraction for @assistant/services.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/** A simple console-based logger implementation. */
export class ConsoleLogger implements Logger {
  constructor(private readonly context: string) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(`[DEBUG] [${this.context}] ${message}`, meta ?? '');
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(`[INFO]  [${this.context}] ${message}`, meta ?? '');
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN]  [${this.context}] ${message}`, meta ?? '');
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] [${this.context}] ${message}`, meta ?? '');
  }
}
