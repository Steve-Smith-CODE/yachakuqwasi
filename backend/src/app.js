import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';
import errorHandler from './middlewares/errorHandler.middleware.js';
import authRoutes from './routes/auth.routes.js';
import housingRoutes from './routes/housing.routes.js';
import adminRoutes from './routes/admin.routes.js';
import chatRoutes from './routes/chat.routes.js';
import makiRoutes from './routes/maki.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import profileRoutes from './routes/profile.routes.js';
import statsRoutes from './routes/stats.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import logger from './config/logger.js';
import swaggerSpec from './config/swagger.config.js';
import swaggerUi from 'swagger-ui-express';

const app = express();

// Seguridad HTTP
app.use(helmet());

// Compresion gzip de las respuestas (listados de housings pueden ser grandes)
app.use(compression());

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

// Rate limiting para toda la API (ventana/limite via env, ver .env.example)
app.use('/api', apiLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logger de peticiones (asigna req.id para correlacion en logs)
app.use(requestLogger);

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

// Swagger solo en desarrollo (registro sincrono: si fuera async via import()
// dinamico, la ruta se registraria despues del handler 404 de abajo y nunca
// respondería — Express matchea rutas en el orden en que se registran).
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'API - Alquileres UNSCH'
  }));
  logger.info('Swagger disponible en http://localhost:' + process.env.PORT + '/api-docs');
}

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/housings', housingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/maki', makiRoutes);
app.use('/api/favoritos', favoritesRoutes);
app.use('/api/verificacion', verificationRoutes);
app.use('/api/perfil', profileRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notificaciones', notificationsRoutes);

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

export default app;
