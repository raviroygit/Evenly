import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Start the scheduled health check service
 * POST /api/health/start
 */
export const startHealthCheckController = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    // Note: Health check service now auto-starts with the server
    // This endpoint is kept for compatibility but the service runs automatically
    
    res.status(200).send({
      success: true,
      message: 'Health check service is automatically managed by the server',
      data: {
        isRunning: true,
        intervalMs: 2 * 60 * 1000, // 2 minutes
        targetUrl: `${process.env.APP_BASE_URL || 'https://39927be854e3.ngrok-free.app'}/health`,
        autoStart: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: 'Failed to get health check service status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Stop the scheduled health check service
 * POST /api/health/stop
 */
export const stopHealthCheckController = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    // Note: Health check service is automatically managed by the server
    // This endpoint is kept for compatibility
    
    res.status(200).send({
      success: true,
      message: 'Health check service is automatically managed by the server',
      data: {
        isRunning: true,
        intervalMs: 2 * 60 * 1000, // 2 minutes
        targetUrl: `${process.env.APP_BASE_URL || 'https://39927be854e3.ngrok-free.app'}/health`,
        autoStart: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: 'Failed to get health check service status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Get the status of the health check service
 * GET /api/health/status
 */
export const getHealthCheckStatusController = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    res.status(200).send({
      success: true,
      message: 'Health check service status retrieved successfully',
      data: {
        isRunning: true,
        intervalMs: 2 * 60 * 1000, // 2 minutes
        targetUrl: `${process.env.APP_BASE_URL || 'https://39927be854e3.ngrok-free.app'}/health`,
        autoStart: true,
        description: 'Health check service runs automatically in a separate background process',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).send({
      success: false,
      message: 'Failed to get health check service status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Perform a manual health check
 * POST /api/health/manual-check
 */
export const manualHealthCheckController = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    const healthUrl = `${process.env.APP_BASE_URL || 'https://39927be854e3.ngrok-free.app'}/health`;
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Evenly-Backend-ManualCheck/1.0.0',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json() as {
        status?: string;
        database?: string;
        version?: string;
      };
      
      res.status(200).send({
        success: true,
        message: 'Manual health check completed successfully',
        data: {
          success: true,
          timestamp,
          responseTime,
          status: data.status || 'unknown',
          database: data.database,
          version: data.version,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(200).send({
        success: false,
        message: 'Manual health check failed',
        data: {
          success: false,
          timestamp,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    const responseTime = Date.now() - Date.now();
    
    res.status(200).send({
      success: false,
      message: 'Manual health check failed',
      data: {
        success: false,
        timestamp: new Date().toISOString(),
        responseTime,
        error: error.message || 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};
