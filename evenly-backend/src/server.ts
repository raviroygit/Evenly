import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cookie from '@fastify/cookie';
import { config } from './config/config';
import { testConnection, closePool } from './config/database';
import { groupRoutes } from './routes/groupRoutes';
import { expenseRoutes } from './routes/expenseRoutes';
import { balanceRoutes } from './routes/balanceRoutes';
import { paymentRoutes } from './routes/paymentRoutes';
import { groupInvitationRoutes } from './routes/groupInvitationRoutes';
import { authRoutes } from './routes/authRoutes';
import supportRoutes from './routes/supportRoutes';
import { handleError } from './utils/errors';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: config.server.env === 'production' ? 'info' : 'debug',
  },
});

// Register plugins
async function registerPlugins() {
  // Cookie parser
  await fastify.register(cookie);

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  // Helmet for security headers
  await fastify.register(helmet);

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
  });

  // Swagger documentation
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

  // Swagger UI
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
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get('/health', async (_request, _reply) => {
    const dbConnected = await testConnection();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      version: '1.0.0',
    };
  });

  // API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(groupRoutes, { prefix: '/api/groups' });
  await fastify.register(expenseRoutes, { prefix: '/api/expenses' });
  await fastify.register(balanceRoutes, { prefix: '/api/balances' });
  await fastify.register(paymentRoutes, { prefix: '/api/payments' });
  await fastify.register(groupInvitationRoutes, { prefix: '/api/invitations' });
  await fastify.register(supportRoutes, { prefix: '/api/support' });
}

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  handleError(error, reply);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  try {
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
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();

    // Start server
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log(`🚀 Server running on http://${config.server.host}:${config.server.port}`);
    console.log(`📚 API Documentation available at http://${config.server.host}:${config.server.port}/docs`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
start();