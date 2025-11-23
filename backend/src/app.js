import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import traineeRoutes from './routes/trainee.routes.js';
import groupRoutes from './routes/group.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import absenceRoutes from './routes/absence.routes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Security Middleware
app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Sanitize data against NoSQL injection

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logging (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', { stream: logger.stream }));
  }
}

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'OFPPT API Docs',
}));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'OFPPT Absence Management API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Test route
app.get('/api/test', (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.info('Test endpoint accessed');
  }
  res.json({ 
    status: 'ok', 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiting to all API routes (except in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', apiLimiter);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trainees', traineeRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/absences', absenceRoutes);

// 404 handler
app.use((req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  }
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
