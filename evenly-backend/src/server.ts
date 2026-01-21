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
  console.log('🔍 Starting simple health check service...');
  
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
        console.log(`✅ Health check successful: ${responseTime}ms`);
      } else {
        console.error(`❌ Health check failed: HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error(`❌ Health check error: ${error.message}`);
    }
  }, 2 * 60 * 1000); // 2 minutes
  
  console.log(`✅ Health check service started`);
  console.log(`🎯 Target URL: http://${config.server.host}:${config.server.port}/health`);
  console.log(`⏰ Interval: Every 2 minutes`);
}

/**
 * Stop health check service
 */
function stopHealthCheckService(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('✅ Health check service stopped');
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
    console.log('✅ Cookie plugin registered');
  } catch (error) {
    console.warn('⚠️  Failed to register cookie plugin:', error);
  }

  // CORS - filter out empty origins
  try {
    const corsOrigins = [config.cors.origin, config.cors.CORS_ORIGIN1].filter(origin => origin && origin.trim());
    await fastify.register(cors, {
      origin: corsOrigins.length > 0 ? corsOrigins : true, // Allow all if no origins configured
      credentials: true,
    });
    console.log('✅ CORS plugin registered');
  } catch (error) {
    console.warn('⚠️  Failed to register CORS plugin:', error);
  }

  // Helmet for security headers
  try {
    await fastify.register(helmet);
    console.log('✅ Helmet plugin registered');
  } catch (error) {
    console.warn('⚠️  Failed to register helmet plugin:', error);
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
    console.log('✅ Swagger plugin registered');
  } catch (error) {
    console.warn('⚠️  Failed to register swagger plugin:', error);
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
    console.log('✅ Swagger UI plugin registered');
  } catch (error) {
    console.warn('⚠️  Failed to register swagger UI plugin:', error);
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
    console.log('✅ All API routes registered successfully');
  } catch (error) {
    console.warn('⚠️  Some API routes failed to register:', error);
    console.warn('⚠️  Service will continue with basic functionality');
  }
  // Health check management routes removed - using simple background service instead
}

// Error handler
fastify.setErrorHandler((error: Error, request, reply) => {
  handleError(error, reply);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  try {
    // Stop health check service
    stopHealthCheckService();
    
    await fastify.close();
    await closePool();
    console.log('Server closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server
const start = async () => {
  try {
    console.log('📦 Starting server initialization...');
    console.log(`🔧 Server configuration: PORT=${config.server.port}, HOST=${config.server.host}, NODE_ENV=${config.server.env}`);
    console.log(`🔧 Environment PORT: ${process.env.PORT || 'not set'}`);
    console.log(`🔧 Process PID: ${process.pid}`);
    
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
      console.log('✅ Plugins registered');
    } catch (error) {
      console.error('⚠️  Error registering plugins:', error);
      console.error('⚠️  Continuing startup - some features may not be available');
    }

    try {
      await registerRoutes();
      console.log('✅ Routes registered');
      console.log(`📚 API Documentation available at http://${config.server.host}:${config.server.port}/docs`);
    } catch (error) {
      console.error('⚠️  Error registering routes:', error);
      console.error('⚠️  Continuing startup - basic routes are available');
    }

    // Run database migrations before starting the server
    console.log('🔄 Running database migrations...');
    const migrationSuccess = await initializeDatabase();
    if (!migrationSuccess) {
      console.error('❌ Database migration failed!');
      process.exit(1);
    }
    console.log('✅ Database migrations completed successfully');

    // Now start the server after plugins and routes are registered
    const port = config.server.port || parseInt(process.env.PORT || '8080', 10);
    const host = config.server.host || '0.0.0.0';

    console.log(`🔧 Starting server on ${host}:${port}...`);

    await fastify.listen({
      port: port,
      host: host,
    });

    console.log(`🚀 Server running on http://${host}:${port}`);
    
    // Test database connection asynchronously after server starts
    // This prevents blocking Cloud Run startup timeout
    testConnection().then((dbConnected) => {
      if (!dbConnected) {
        if (config.server.env === 'production') {
          console.warn('⚠️  Database connection failed, but continuing in production mode');
          console.warn('⚠️  Some features may not work until database is properly configured');
        } else {
          console.error('❌ Database connection failed');
        }
      }
    }).catch((error) => {
      console.error('❌ Database connection error:', error);
      if (config.server.env !== 'production') {
        console.error('⚠️  Continuing in development mode despite database error');
      }
    });
    
    // Auto-start health check service in background
    startHealthCheckService();
  } catch (error) {
    console.error('❌ Fatal error starting server:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
console.log('🚀 Starting Evenly Backend server...');
start().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});