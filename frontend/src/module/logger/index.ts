import { typecastError } from './error';

type LogMeta = Record<string, unknown> & { error?: Error };

/**
 * Thin console-backed logger. Centralised so the transport can later be
 * swapped for a real sink (Sentry, Datadog, etc.) without touching callers.
 *
 * TODO: forward `error`/`warn` to a remote error-reporting service.
 * TODO: gate `debug`/`log` behind import.meta.env.DEV.
 */
const log = (message: string, meta?: LogMeta): void => {
  console.log(message, meta ?? '');
};

const info = (message: string, meta?: LogMeta): void => {
  console.info(message, meta ?? '');
};

const warn = (message: string, meta?: LogMeta): void => {
  console.warn(message, meta ?? '');
};

const debug = (message: string, meta?: LogMeta): void => {
  console.debug(message, meta ?? '');
};

const error = (message: string, meta?: LogMeta): void => {
  const err = typecastError(meta?.error, message);
  console.error(message, err, meta ?? '');
};

export const logger = {
  log,
  info,
  warn,
  debug,
  error,
};
