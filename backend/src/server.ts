import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import uploadRoutes from './routes/upload.routes';
import analyticsRoutes from './routes/analytics.routes';
import patientsRoutes from './routes/patients.routes';
import healthRoutes from './routes/health.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Import middleware
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';

// Import services
import { logger } from './utils/logger';
import { initializeBigQuery } from './services/bigquery.service';
import { initializeRedis } from './services/redis.service';

class Server {
  private app: Application;
  private server: any;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '8080', 10);
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    const corsOptions: cors.CorsOptions = {
      origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
      maxAge: 86400,
    };
    this.app.use(cors(corsOptions));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Request logging
    this.app.use(requestLogger);

    // Trust proxy for Cloud Run
    this.app.set('trust proxy', true);
  }

  private initializeRoutes(): void {
    // Health check routes (no auth required)
    this.app.use('/', healthRoutes);

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/upload', uploadRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/patients', patientsRoutes);
    this.app.use('/api/dashboards', dashboardRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
        path: req.originalUrl,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    // Initialize BigQuery (optional in local/dev environments)
    try {
      await initializeBigQuery();
      logger.info('BigQuery initialized successfully');
    } catch (error) {
      logger.warn('BigQuery initialization skipped or failed; continuing without BigQuery', error);
    }

    // Initialize Redis (optional, will fail gracefully if not available)
    try {
      await initializeRedis();
      logger.info('Redis initialized successfully');
    } catch (error) {
      logger.warn('Redis initialization failed, using in-memory cache', error);
    }

    logger.info('Service initialization completed');
  }

  public async start(): Promise<void> {
    try {
      // Initialize services
      await this.initializeServices();

      // Create HTTP server
      this.server = createServer(this.app);

      // Start listening
      this.server.listen(this.port, '0.0.0.0', () => {
        logger.info(`Server is running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`CORS enabled for: ${process.env.ALLOWED_ORIGINS}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));
    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('Received shutdown signal, closing server gracefully...');
    
    this.server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  }
}

// Start the server
const server = new Server();
server.start().catch((error) => {
  logger.error('Server startup failed', error);
  process.exit(1);
});

export default server;
