import type { InvocationContext } from '@azure/functions';

export interface Logger {
  debug(message: string, properties?: Record<string, unknown>): void;
  info(message: string, properties?: Record<string, unknown>): void;
  warn(message: string, properties?: Record<string, unknown>): void;
  error(message: string, properties?: Record<string, unknown>): void;
  trace(message: string, properties?: Record<string, unknown>): void;
}

const format = (message: string, properties?: Record<string, unknown>): string => {
  if (!properties || Object.keys(properties).length === 0) return message;
  try {
    return `${message} | ${JSON.stringify(properties)}`;
  } catch {
    return message;
  }
};

export const createLogger = (context: InvocationContext): Logger => ({
  debug: (message, properties) => context.trace(format(message, properties)),
  info: (message, properties) => context.info(format(message, properties)),
  warn: (message, properties) => context.warn(format(message, properties)),
  error: (message, properties) => context.error(format(message, properties)),
  trace: (message, properties) => context.trace(format(message, properties)),
});
