import winston from 'winston';
import path from 'path';
import fs from 'fs';

// En Vercel (y cualquier entorno serverless) el filesystem es de solo lectura
// salvo /tmp, y los logs ya se capturan via stdout/stderr del propio hosting
// - escribir a ./logs ahi tira EROFS y tumba la funcion en el primer request.
const isServerless = Boolean(process.env.VERCEL);
const logsDir = path.join(process.cwd(), 'logs');

if (!isServerless && !fs.existsSync(logsDir)) {
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
    ...(isServerless
      ? []
      : [
          new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format
          }),
          new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format
          })
        ])
  ]
});

export default logger;
