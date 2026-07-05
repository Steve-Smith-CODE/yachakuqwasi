import { randomUUID } from 'crypto';
import logger from '../config/logger.js';

export function requestLogger(req, res, next) {
  req.id = randomUUID();
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.path} - ${res.statusCode} [${duration}ms]`, {
      requestId: req.id
    });
  });

  next();
}
