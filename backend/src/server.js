import app from './app.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || 'localhost';

async function start() {
  try {
    const server = app.listen(PORT, HOST, () => {
      logger.info('Servidor escuchando en http://' + HOST + ':' + PORT);
      logger.info('Health check: http://' + HOST + ':' + PORT + '/health');
      if (process.env.NODE_ENV === 'development') {
        logger.info('API Docs: http://' + HOST + ':' + PORT + '/api-docs');
      }
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`${signal} recibido, cerrando servidor...`);
      server.close(() => {
        logger.info('Servidor cerrado');
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Error al iniciar servidor: ' + error.message);
    process.exit(1);
  }
}

export default app;

if (process.env.NODE_ENV !== 'test') {
  start();
}
