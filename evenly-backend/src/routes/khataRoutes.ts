import { FastifyInstance } from 'fastify';
import { KhataController } from '../controllers/khataController';
import { authenticateToken } from '../middlewares/auth';
import fastifyMultipart from '@fastify/multipart';

export async function khataRoutes(fastify: FastifyInstance) {
  // Register multipart for file uploads
  // Increased fileSize limit to 10MB for image uploads
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit (was 1MB default)
      files: 1, // Only allow 1 file per request
    },
  });

  // Apply authentication to all khata routes
  fastify.addHook('preHandler', authenticateToken);

  // Financial Summary
  fastify.get('/summary', {
    schema: {
      description: 'Get financial summary (total give and total get)',
      tags: ['Khata'],
    },
  }, KhataController.getFinancialSummary);

  // Customers
  fastify.get('/customers', {
    schema: {
      description: 'Get all customers with optional filters',
      tags: ['Khata'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          filterType: {
            type: 'string',
            enum: ['all', 'give', 'get', 'settled'],
          },
          sortType: {
            type: 'string',
            enum: ['most-recent', 'oldest', 'highest-amount', 'least-amount', 'name-az'],
          },
        },
      },
    },
  }, KhataController.getCustomers);

  fastify.get('/customers/:customerId', {
    schema: {
      description: 'Get customer by ID',
      tags: ['Khata'],
      params: {
        type: 'object',
        required: ['customerId'],
        properties: {
          customerId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, KhataController.getCustomerById);

  fastify.post('/customers', {
    schema: {
      description: 'Create a new customer',
      tags: ['Khata'],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          avatar: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
  }, KhataController.createCustomer);

  fastify.put('/customers/:customerId', {
    schema: {
      description: 'Update a customer',
      tags: ['Khata'],
      params: {
        type: 'object',
        required: ['customerId'],
        properties: {
          customerId: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          avatar: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
  }, KhataController.updateCustomer);

  fastify.delete('/customers/:customerId', {
    schema: {
      description: 'Delete a customer',
      tags: ['Khata'],
      params: {
        type: 'object',
        required: ['customerId'],
        properties: {
          customerId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, KhataController.deleteCustomer);

  // Transactions
  fastify.get('/customers/:customerId/transactions', {
    schema: {
      description: 'Get customer transactions',
      tags: ['Khata'],
      params: {
        type: 'object',
        required: ['customerId'],
        properties: {
          customerId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, KhataController.getCustomerTransactions);

  fastify.post('/transactions', {
    schema: {
      description: 'Create a new transaction (supports JSON or multipart/form-data for image upload)',
      tags: ['Khata'],
      // Note: Schema validation is disabled for this route to support both JSON and multipart/form-data
      // The controller handles validation manually
    },
  }, KhataController.createTransaction);

  fastify.put('/transactions/:transactionId', {
    schema: {
      description: 'Update a transaction (supports JSON or multipart/form-data for image upload)',
      tags: ['Khata'],
      params: {
        type: 'object',
        required: ['transactionId'],
        properties: {
          transactionId: { type: 'string', format: 'uuid' },
        },
      },
      // Note: Schema validation is disabled for body to support both JSON and multipart/form-data
      // The controller handles validation manually
    },
  }, KhataController.updateTransaction);

  fastify.delete('/transactions/:transactionId', {
    schema: {
      description: 'Delete a transaction',
      tags: ['Khata'],
      params: {
        type: 'object',
        required: ['transactionId'],
        properties: {
          transactionId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, KhataController.deleteTransaction);

  // Image Operations
  fastify.delete('/delete-image', {
    schema: {
      description: 'Delete transaction image from Cloudinary',
      tags: ['Khata'],
      body: {
        type: 'object',
        required: ['imageUrl'],
        properties: {
          imageUrl: { type: 'string', minLength: 1 },
        },
      },
    },
  }, KhataController.deleteTransactionImage);

  fastify.post('/upload', {
    schema: {
      description: 'Upload image to Cloudinary',
      tags: ['Khata'],
      consumes: ['multipart/form-data'],
    },
  }, KhataController.uploadImage);
}

