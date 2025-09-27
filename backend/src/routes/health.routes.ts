import { Router, Request, Response } from 'express';
import { bigqueryService } from '../services/bigquery.service';
import { geminiService } from '../services/gemini.service';
import redisService from '../services/redis.service';
import { logger } from '../utils/logger';

const router = Router();

// Basic health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Liveness probe
router.get('/liveness', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Readiness probe
router.get('/readiness', async (req: Request, res: Response) => {
  try {
    const checks = {
      server: true,
      bigquery: false,
      gemini: false,
      redis: false,
    };

    // Check BigQuery
    try {
      const [datasets] = await bigqueryService.bigquery.getDatasets({ maxResults: 1 });
      checks.bigquery = datasets.length >= 0;
    } catch (error) {
      logger.warn('BigQuery health check failed:', error);
    }

    // Check Gemini
    checks.gemini = geminiService.isAvailable();

    // Check Redis
    checks.redis = redisService.isOpen;

    const allHealthy = Object.values(checks).every(v => v === true);
    const criticalHealthy = checks.server && checks.bigquery;

    if (criticalHealthy) {
      res.status(200).json({
        status: allHealthy ? 'ready' : 'degraded',
        checks,
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        checks,
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
    });
  }
});

// Detailed health status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = {
      application: {
        name: 'Progress Tracker Backend',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      services: {
        bigquery: {
          status: 'unknown',
          dataset: process.env.BIGQUERY_DATASET,
          location: process.env.GCP_LOCATION,
        },
        gemini: geminiService.getStatus(),
        redis: {
          connected: redisService.isOpen,
          url: process.env.REDIS_URL ? 'configured' : 'not configured',
        },
        email: {
          url: process.env.EMAIL_SERVICE_URL,
          configured: !!process.env.EMAIL_SERVICE_URL,
        },
      },
      timestamp: new Date().toISOString(),
    };

    // Test BigQuery connection
    try {
      const [datasets] = await bigqueryService.bigquery.getDatasets({ maxResults: 1 });
      status.services.bigquery.status = 'connected';
    } catch (error) {
      status.services.bigquery.status = 'disconnected';
    }

    res.json(status);
  } catch (error) {
    logger.error('Status check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system status',
    });
  }
});

// Metrics endpoint (Prometheus format)
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = [];

    // System metrics
    const memoryUsage = process.memoryUsage();
    metrics.push(`# HELP process_memory_heap_used_bytes Process heap memory used`);
    metrics.push(`# TYPE process_memory_heap_used_bytes gauge`);
    metrics.push(`process_memory_heap_used_bytes ${memoryUsage.heapUsed}`);

    metrics.push(`# HELP process_uptime_seconds Process uptime`);
    metrics.push(`# TYPE process_uptime_seconds gauge`);
    metrics.push(`process_uptime_seconds ${process.uptime()}`);

    // Service health metrics
    metrics.push(`# HELP service_health Service health status`);
    metrics.push(`# TYPE service_health gauge`);
    metrics.push(`service_health{service="bigquery"} ${1}`);
    metrics.push(`service_health{service="gemini"} ${geminiService.isAvailable() ? 1 : 0}`);
    metrics.push(`service_health{service="redis"} ${redisService.isOpen ? 1 : 0}`);

    res.set('Content-Type', 'text/plain');
    res.send(metrics.join('\n'));
  } catch (error) {
    logger.error('Metrics generation failed:', error);
    res.status(500).send('Failed to generate metrics');
  }
});

export default router;
