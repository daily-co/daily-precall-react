// Adapted from https://www.meticulous.ai/blog/getting-started-with-react-logging
export interface LogFn {
  (message?: string, ...optionalParams: any[]): void;
}

export interface LoggerInterface {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

export type LogLevel = 'log' | 'warn' | 'error';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

class ConsoleLogger implements LoggerInterface {
  readonly info: LogFn;
  readonly warn: LogFn;
  readonly error: LogFn;

  constructor(options?: { level?: LogLevel }) {
    const { level } = options || {};
    this.error = console.error.bind(
      console,
      'DAILY: %c%s',
      'background-color: #F5EDE9; padding: 2px 5px;',
    );

    if (level === 'error') {
      this.warn = noop;
      this.info = noop;
      return;
    }

    this.warn = console.warn.bind(
      console,
      'DAILY: %c%s',
      'background-color: #F5F5E9; padding: 2px 5px;',
    );

    if (level === 'warn') {
      this.info = noop;
      return;
    }

    this.info = console.info.bind(
      console,
      'DAILY: %c%s',
      'background-color: #E9F5EC; padding: 2px 5px;',
    );
  }
}

export const logger = new ConsoleLogger();
