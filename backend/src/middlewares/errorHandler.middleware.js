import logger from '../config/logger.js';

export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  const isOperational = err.isOperational ?? false;

  logger.error(err.stack || err.message, {
    requestId: req.id,
    code: err.code,
    statusCode,
    path: req.path,
    ...(isOperational ? {} : { stack: err.stack })
  });

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    ...(err.details && { details: err.details })
  });
}
