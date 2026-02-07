import { FastifyRequest, FastifyReply } from 'fastify';
import { KhataService } from '../services/khataService';
import { OrganizationService } from '../services/organizationService';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/errors';
import { uploadSingleImage, deleteImage } from '../utils/cloudinary';

export class KhataController {
  /**
   * Get all customers with filters
   */
  static getCustomers = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const query = request.query as {
      search?: string;
      filterType?: 'all' | 'give' | 'get' | 'settled';
      sortType?: 'most-recent' | 'oldest' | 'highest-amount' | 'least-amount' | 'name-az';
    };

    const customers = await KhataService.getCustomers(user.id, {
      search: query.search,
      filterType: query.filterType || 'all',
      sortType: query.sortType || 'most-recent',
      organizationId,
    });

    reply.send({
      success: true,
      data: customers,
      message: 'Customers retrieved successfully',
    });
  });

  /**
   * Get customer by ID
   */
  static getCustomerById = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { customerId } = request.params as { customerId: string };

    const customer = await KhataService.getCustomerById(customerId, user.id, organizationId);

    reply.send({
      success: true,
      data: customer,
      message: 'Customer retrieved successfully',
    });
  });

  /**
   * Create a new customer
   */
  static createCustomer = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const body = request.body as {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      notes?: string;
    };

    if (!body.name) {
      return reply.status(400).send({
        success: false,
        message: 'Customer name is required',
      });
    }

    let organizationId = (request as any).organizationId;
    if (!organizationId) {
      organizationId = await OrganizationService.getDefaultLocalOrganizationId(user.id) ?? undefined;
    }
    if (!organizationId) {
      return reply.status(400).send({
        success: false,
        message: 'Organization ID is required',
      });
    }

    const customer = await KhataService.createCustomer(body, user.id, organizationId);

    reply.status(201).send({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  });

  /**
   * Update a customer
   */
  static updateCustomer = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { customerId } = request.params as { customerId: string };
    const body = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      notes?: string;
    };

    const customer = await KhataService.updateCustomer(customerId, body, user.id, organizationId);

    reply.send({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  });

  /**
   * Delete a customer
   */
  static deleteCustomer = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { customerId } = request.params as { customerId: string };

    await KhataService.deleteCustomer(customerId, user.id, organizationId);

    reply.send({
      success: true,
      message: 'Customer deleted successfully',
    });
  });

  /**
   * Get customer transactions
   */
  static getCustomerTransactions = asyncHandler(
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { user } = request as AuthenticatedRequest;
      const organizationId = (request as any).organizationId;
      const { customerId } = request.params as { customerId: string };

      const transactions = await KhataService.getCustomerTransactions(customerId, user.id, organizationId);

      reply.send({
        success: true,
        data: transactions,
        message: 'Transactions retrieved successfully',
      });
    }
  );

  /**
   * Create a new transaction (with optional image upload)
   */
  static createTransaction = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;

    // Handle multipart form data (for image upload)
    let imageUrl: string | undefined;
    const data: any = {};
    
    // Check if request has multipart data
    const isMultipart = request.isMultipart();
    if (isMultipart) {
      // Parse multipart form data
      try {
        const parts = request.parts();
        
        for await (const part of parts) {
          if (part.type === 'file') {
            // Handle image upload
            try {
              const buffer = await part.toBuffer();
              const mimetype = part.mimetype;
              const result = await uploadSingleImage(buffer, 'khata', mimetype);
              imageUrl = result.url;
            } catch (uploadError) {
              return reply.status(400).send({
                success: false,
                message: 'Failed to upload image: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error'),
              });
            }
          } else {
            // Handle form fields - text fields use part.value directly
            try {
              const fieldname = part.fieldname;
              // For text fields, part.value is the value (string or promise)
              const value = typeof part.value === 'string' 
                ? part.value 
                : await part.value;
              if (fieldname === 'customerId') data.customerId = value;
              else if (fieldname === 'type') data.type = value as 'give' | 'get';
              else if (fieldname === 'amount') data.amount = value;
              else if (fieldname === 'currency') data.currency = value;
              else if (fieldname === 'description') data.description = value;
              else if (fieldname === 'transactionDate') data.transactionDate = value;
            } catch (fieldError) {
              // Continue with other fields
            }
          }
        }
        if (imageUrl) {
          data.imageUrl = imageUrl;
        }
      } catch (multipartError) {
        return reply.status(400).send({
          success: false,
          message: 'Failed to parse form data: ' + (multipartError instanceof Error ? multipartError.message : 'Unknown error'),
        });
      }
    } else {
      // Handle regular JSON body
      const body = request.body as {
        customerId: string;
        type: 'give' | 'get';
        amount: string;
        currency?: string;
        description?: string;
        imageUrl?: string;
        transactionDate?: string;
      };
      Object.assign(data, body);
    }
    if (!data.customerId || !data.type || !data.amount) {
      return reply.status(400).send({
        success: false,
        message: 'Customer ID, type, and amount are required',
      });
    }

    const transaction = await KhataService.createTransaction(data, user.id, organizationId);

    reply.status(201).send({
      success: true,
      data: transaction,
      message: 'Transaction created successfully',
    });
  });

  /**
   * Update a transaction (with optional image upload)
   */
  static updateTransaction = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { transactionId } = request.params as { transactionId: string };

    // Handle multipart form data (for image upload)
    let imageUrl: string | undefined;
    const data: any = {};

    // Check if request has multipart data
    const isMultipart = request.isMultipart();

    if (isMultipart) {
      // Parse multipart form data
      try {
        const parts = request.parts();

        for await (const part of parts) {
          if (part.type === 'file') {
            // Handle image upload
            try {
              const buffer = await part.toBuffer();
              const mimetype = part.mimetype;
              const result = await uploadSingleImage(buffer, 'khata', mimetype);
              imageUrl = result.url;
            } catch (uploadError) {
              return reply.status(400).send({
                success: false,
                message: 'Failed to upload image: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error'),
              });
            }
          } else {
            // Handle form fields
            try {
              const fieldname = part.fieldname;
              const value = typeof part.value === 'string'
                ? part.value
                : await part.value;

              if (fieldname === 'type') data.type = value as 'give' | 'get';
              else if (fieldname === 'amount') data.amount = value;
              else if (fieldname === 'currency') data.currency = value;
              else if (fieldname === 'description') data.description = value;
              else if (fieldname === 'transactionDate') data.transactionDate = value;
              else if (fieldname === 'removeImage' && value === 'true') data.imageUrl = null;
            } catch (fieldError) {
            }
          }
        }

        if (imageUrl) {
          data.imageUrl = imageUrl;
        }
      } catch (multipartError) {
        return reply.status(400).send({
          success: false,
          message: 'Failed to parse form data: ' + (multipartError instanceof Error ? multipartError.message : 'Unknown error'),
        });
      }
    } else {
      // Handle regular JSON body
      const body = request.body as {
        type?: 'give' | 'get';
        amount?: string;
        currency?: string;
        description?: string;
        imageUrl?: string;
        transactionDate?: string;
      };
      Object.assign(data, body);
    }

    const transaction = await KhataService.updateTransaction(transactionId, data, user.id, organizationId);

    reply.send({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully',
    });
  });

  /**
   * Delete a transaction
   */
  static deleteTransaction = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { transactionId } = request.params as { transactionId: string };

    await KhataService.deleteTransaction(transactionId, user.id, organizationId);

    reply.send({
      success: true,
      message: 'Transaction deleted successfully',
    });
  });

  /**
   * Get financial summary
   */
  static getFinancialSummary = asyncHandler(
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { user } = request as AuthenticatedRequest;
      const organizationId = (request as any).organizationId;

      const summary = await KhataService.getFinancialSummary(user.id, organizationId);

      reply.send({
        success: true,
        data: summary,
        message: 'Financial summary retrieved successfully',
      });
    }
  );

  /**
   * Upload image to Cloudinary
   */
  static uploadImage = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({
        success: false,
        message: 'No file uploaded',
      });
    }

    try {
      const buffer = await data.toBuffer();
      const mimetype = data.mimetype;
      const result = await uploadSingleImage(buffer, 'khata', mimetype);

      reply.send({
        success: true,
        data: {
          url: result.url,
          publicId: result.publicId,
        },
        message: 'Image uploaded successfully',
      });
    } catch (uploadError) {
      return reply.status(400).send({
        success: false,
        message: 'Failed to upload image: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error'),
      });
    }
  });

  /**
   * Delete transaction image from Cloudinary
   */
  static deleteTransactionImage = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { imageUrl } = request.body as { imageUrl: string };

    if (!imageUrl) {
      return reply.status(400).send({
        success: false,
        message: 'Image URL is required',
      });
    }

    try {
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');

      if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid Cloudinary URL format',
        });
      }

      // Get everything after 'upload/v{version}/' or 'upload/'
      const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join('/');
      // Remove file extension
      const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
      const deleted = await deleteImage(publicId);

      if (deleted) {
        reply.send({
          success: true,
          message: 'Image deleted successfully',
        });
      } else {
        reply.status(500).send({
          success: false,
          message: 'Failed to delete image from Cloudinary',
        });
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete image',
      });
    }
  });
}

