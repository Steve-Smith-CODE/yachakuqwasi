import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const RESERVED_KEYS = new Set(['level', 'message', 'timestamp']);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.printf((info) => {
    const meta = Object.keys(info).filter((key) => !RESERVED_KEYS.has(key));
    const metaStr = meta.length
      ? ' ' + JSON.stringify(Object.fromEntries(meta.map((key) => [key, info[key]])))
      : '';
    return '[' + info.timestamp + '] ' + info.level + ': ' + info.message + metaStr;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        format
      )
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format
    })
  ]
});

export default logger;
