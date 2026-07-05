import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import logger from './config/logger.js';
import errorHandler from './middlewares/errorHandler.middleware.js';
import authRoutes from './routes/auth.routes.js';
import housingRoutes from './routes/housing.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Seguridad HTTP
app.use(helmet());

// CORS restrictivo
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin.trim())) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logger de peticiones
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    logger[level](`${req.method} ${req.path} - ${res.statusCode} [${duration}ms]`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Swagger solo en desarrollo
if (process.env.NODE_ENV === 'development') {
  import('./config/swagger.config.js').then(({ default: swaggerSpec }) => {
    import('swagger-ui-express').then(({ default: swaggerUi }) => {
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customSiteTitle: 'API - Alquileres UNSCH'
      }));
      logger.info('Swagger disponible en http://localhost:' + process.env.PORT + '/api-docs');
    });
  });
}

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/housings', housingRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Error handler global
app.use(errorHandler);

// Iniciar servidor
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
    process.on('SIGTERM', async () => {
      logger.info('Senial SIGTERM recibida, cerrando servidor...');
      server.close(() => {
        logger.info('Servidor cerrado');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Error al iniciar servidor: ' + error.message);
    process.exit(1);
  }
}

export default app;

if (process.env.NODE_ENV !== 'test') {
  start();
}
