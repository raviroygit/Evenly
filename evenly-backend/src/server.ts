/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
// import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cookie from '@fastify/cookie';
import { config } from './config/config';
import { testConnection, closePool } from './config/database';
import { initializeDatabase } from './utils/migrate';
import { groupRoutes } from './routes/groupRoutes';
import { expenseRoutes } from './routes/expenseRoutes';
import { balanceRoutes } from './routes/balanceRoutes';
import { paymentRoutes } from './routes/paymentRoutes';
import { groupInvitationRoutes } from './routes/groupInvitationRoutes';
import { authRoutes } from './routes/authRoutes';
import supportRoutes from './routes/supportRoutes';
import { khataRoutes } from './routes/khataRoutes';
import appRedirectRoutes from './routes/appRedirectRoutes';
// Health check routes removed - using simple background service instead
import { handleError } from './utils/errors';
// Simple health check service that runs in the main process
let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Start simple health check service
 */
function startHealthCheckService(): void {
  
  // Run health check every 2 minutes
  healthCheckInterval = setInterval(async () => {
    try {
      const startTime = Date.now();
      const healthUrl = `http://${config.server.host}:${config.server.port}/health`;
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Evenly-Backend-HealthCheck/1.0.0',
        },
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
      } else {
      }
    } catch (error: any) {
    }
  }, 2 * 60 * 1000); // 2 minutes
  
}

/**
 * Stop health check service
 */
function stopHealthCheckService(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: config.server.env === 'production' ? 'info' : 'debug',
  },
});

// Register plugins
async function registerPlugins() {
  // Cookie parser
  try {
    await fastify.register(cookie);
  } catch (error) {
  }

  // CORS - filter out empty origins
  try {
    const corsOrigins = [config.cors.origin, config.cors.CORS_ORIGIN1].filter(origin => origin && origin.trim());
    await fastify.register(cors, {
      origin: corsOrigins.length > 0 ? corsOrigins : true, // Allow all if no origins configured
      credentials: true,
    });
  } catch (error) {
  }

  // Helmet for security headers
  try {
    await fastify.register(helmet);
  } catch (error) {
  }

  // Rate limiting - DISABLED for development
  // await fastify.register(rateLimit, {
  //   max: config.rateLimit.max,
  //   timeWindow: config.rateLimit.timeWindow,
  // });

  // Swagger documentation
  try {
    await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Evenly API',
        description: 'Splitwise-like expense splitting API',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@evenly.app',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://${config.swagger.host}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });
  } catch (error) {
  }

  // Swagger UI
  try {
    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      uiHooks: {
        onRequest: function (request, reply, next) {
          next();
        },
        preHandler: function (request, reply, next) {
          next();
        },
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, _request, _reply) => {
        return swaggerObject;
      },
      transformSpecificationClone: true,
    });
  } catch (error) {
  }
}

// Register routes
async function registerRoutes() {
  // Note: /health and / routes are registered earlier in start() for faster Cloud Run startup
  // Only register API routes here
  
  // API routes
  try {
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(groupRoutes, { prefix: '/api/groups' });
    await fastify.register(expenseRoutes, { prefix: '/api/expenses' });
    await fastify.register(balanceRoutes, { prefix: '/api/balances' });
    await fastify.register(paymentRoutes, { prefix: '/api/payments' });
    await fastify.register(groupInvitationRoutes, { prefix: '/api/invitations' });
    await fastify.register(supportRoutes, { prefix: '/api/support' });
    await fastify.register(khataRoutes, { prefix: '/api/khata' });
    await fastify.register(appRedirectRoutes, { prefix: '/api' }); // No prefix needed, routes are /app/download
  } catch (error) {
  }
  // Health check management routes removed - using simple background service instead
}

// Error handler
fastify.setErrorHandler((error: Error, request, reply) => {
  handleError(error, reply);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  try {
    // Stop health check service
    stopHealthCheckService();
    
    await fastify.close();
    await closePool();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

// Start server
const start = async () => {
  try {
    
    // Register basic health check route FIRST (before plugins)
    // This ensures Cloud Run can detect the server is listening
    // Keep it simple - no database calls, just return OK immediately
    fastify.get('/health', async (_request, _reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.server.env || 'production',
        message: 'Server is running'
      };
    });

    // Register root route
    fastify.get('/', async (_request, _reply) => {
      return {
        message: 'Evenly Backend API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: config.server.env
      };
    });

    // CRITICAL: Register plugins and routes BEFORE starting the server
    // Fastify doesn't allow plugin/route registration after listen() is called
    // We register them synchronously to ensure they're ready before the server starts
    try {
      await registerPlugins();
    } catch (error) {
    }

    try {
      await registerRoutes();
    } catch (error) {
    }

    // Run database migrations before starting the server
    const migrationSuccess = await initializeDatabase();
    if (!migrationSuccess) {
      process.exit(1);
    }

    // Now start the server after plugins and routes are registered
    const port = config.server.port || parseInt(process.env.PORT || '8080', 10);
    const host = config.server.host || '0.0.0.0';


    await fastify.listen({
      port: port,
      host: host,
    });

    
    // Test database connection asynchronously after server starts
    // This prevents blocking Cloud Run startup timeout
    testConnection().then((dbConnected) => {
      if (!dbConnected) {
        if (config.server.env === 'production') {
        } else {
        }
      }
    }).catch((error) => {
      if (config.server.env !== 'production') {
      }
    });
    
    // Auto-start health check service in background
    startHealthCheckService();
  } catch (error) {
    if (error instanceof Error) {
    }
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  process.exit(1);
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
start().catch((error) => {
  process.exit(1);
});