import logger from '../config/logger.js';

export default function errorHandler(err, req, res, next) {
  logger.error(err.stack || err.message);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  res.status(statusCode).json({
    error: message,
    status: statusCode
  });
}
