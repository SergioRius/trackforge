import { ILogger } from '../application/ports.js';
import pino from 'pino';

export function createLogger(): ILogger {
  const logger = pino({
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined
        : {
            target: 'pino-pretty',
            options: { colorize: true },
          },
    level: process.env.LOG_LEVEL ?? 'info',
  });

  return {
    info: (msg, data) => logger.info(data, msg),
    warn: (msg, data) => logger.warn(data, msg),
    error: (msg, data) => logger.error(data, msg),
    debug: (msg, data) => logger.debug(data, msg),
  };
}
