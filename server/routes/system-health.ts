import express from 'express';
import { DatabaseOptimizer } from '../services/database-optimizer';
import { OpenAIMonitor } from '../services/openai-monitor';
import { authenticateJWT } from '../auth';

const router = express.Router();

// Public health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbHealth = await DatabaseOptimizer.healthCheck();
    const systemStats = await DatabaseOptimizer.getSystemStats();
    
    const health = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbHealth.healthy ? 'up' : 'down',
        latency: dbHealth.latency,
        error: dbHealth.error,
      },
      system: systemStats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    res.status(dbHealth.healthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Admin-only detailed monitoring endpoint
router.get('/monitor', authenticateJWT, async (req, res) => {
  try {
    // Only allow admin users to access monitoring data
    if (req.user?.role !== 'admin' && req.user?.role !== 'supergod') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [dbHealth, systemStats, openAIStats] = await Promise.all([
      DatabaseOptimizer.healthCheck(),
      DatabaseOptimizer.getSystemStats(),
      OpenAIMonitor.getInstance().getDailyStats(),
    ]);

    const monitoring = {
      timestamp: new Date().toISOString(),
      database: {
        status: dbHealth.healthy ? 'up' : 'down',
        latency: dbHealth.latency,
        error: dbHealth.error,
      },
      system: systemStats,
      openai: openAIStats,
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    res.json(monitoring);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Monitoring failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Database cleanup endpoint (admin only)
router.post('/cleanup', authenticateJWT, async (req, res) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'supergod') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await DatabaseOptimizer.cleanupOldData();
    
    res.json({
      success: result.success,
      message: 'Database cleanup completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Cleanup failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;