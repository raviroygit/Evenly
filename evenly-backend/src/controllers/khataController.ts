import { FastifyRequest, FastifyReply } from 'fastify';
import { KhataService } from '../services/khataService';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/errors';
import { uploadSingleImage } from '../utils/cloudinary';

export class KhataController {
  /**
   * Get all customers with filters
   */
  static getCustomers = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const query = request.query as {
      search?: string;
      filterType?: 'all' | 'give' | 'get' | 'settled';
      sortType?: 'most-recent' | 'oldest' | 'highest-amount' | 'least-amount' | 'name-az';
    };

    const customers = await KhataService.getCustomers(user.id, {
      search: query.search,
      filterType: query.filterType || 'all',
      sortType: query.sortType || 'most-recent',
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
    const { customerId } = request.params as { customerId: string };

    const customer = await KhataService.getCustomerById(customerId, user.id);

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

    const customer = await KhataService.createCustomer(body, user.id);

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
    const { customerId } = request.params as { customerId: string };
    const body = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      notes?: string;
    };

    const customer = await KhataService.updateCustomer(customerId, body, user.id);

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
    const { customerId } = request.params as { customerId: string };

    await KhataService.deleteCustomer(customerId, user.id);

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
      const { customerId } = request.params as { customerId: string };

      const transactions = await KhataService.getCustomerTransactions(customerId, user.id);

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
    
    // Handle multipart form data (for image upload)
    let imageUrl: string | undefined;
    const data: any = {};
    
    // Check if request has multipart data
    const isMultipart = request.isMultipart();
    console.log('Request isMultipart:', isMultipart);
    console.log('Content-Type:', request.headers['content-type']);
    
    if (isMultipart) {
      // Parse multipart form data
      try {
        const parts = request.parts();
        
        for await (const part of parts) {
          console.log('Processing part:', { type: part.type, fieldname: part.fieldname });
          
          if (part.type === 'file') {
            // Handle image upload
            try {
              const buffer = await part.toBuffer();
              console.log('Image buffer size:', buffer.length);
              const result = await uploadSingleImage(buffer, 'khata');
              imageUrl = result.url;
              console.log('Image uploaded successfully:', imageUrl);
            } catch (uploadError) {
              console.error('Error uploading image:', uploadError);
              return reply.status(500).send({
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
              
              console.log('Read field:', fieldname, '=', value);
              
              if (fieldname === 'customerId') data.customerId = value;
              else if (fieldname === 'type') data.type = value as 'give' | 'get';
              else if (fieldname === 'amount') data.amount = value;
              else if (fieldname === 'currency') data.currency = value;
              else if (fieldname === 'description') data.description = value;
              else if (fieldname === 'transactionDate') data.transactionDate = value;
            } catch (fieldError) {
              console.error('Error reading form field:', fieldError, 'fieldname:', part.fieldname);
              // Continue with other fields
            }
          }
        }
        
        console.log('Parsed data after multipart:', JSON.stringify(data, null, 2));
        
        if (imageUrl) {
          data.imageUrl = imageUrl;
        }
      } catch (multipartError) {
        console.error('Error parsing multipart data:', multipartError);
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

    console.log('Final data before validation:', JSON.stringify(data, null, 2));
    
    if (!data.customerId || !data.type || !data.amount) {
      console.error('Validation failed - missing required fields:', {
        hasCustomerId: !!data.customerId,
        hasType: !!data.type,
        hasAmount: !!data.amount,
        data: data,
      });
      return reply.status(400).send({
        success: false,
        message: 'Customer ID, type, and amount are required',
      });
    }

    const transaction = await KhataService.createTransaction(data, user.id);

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
              const result = await uploadSingleImage(buffer, 'khata');
              imageUrl = result.url;
            } catch (uploadError) {
              console.error('Error uploading image:', uploadError);
              return reply.status(500).send({
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
            } catch (fieldError) {
              console.error('Error reading form field:', fieldError);
            }
          }
        }

        if (imageUrl) {
          data.imageUrl = imageUrl;
        }
      } catch (multipartError) {
        console.error('Error parsing multipart data:', multipartError);
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

    const transaction = await KhataService.updateTransaction(transactionId, data, user.id);

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
    const { transactionId } = request.params as { transactionId: string };

    await KhataService.deleteTransaction(transactionId, user.id);

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

      const summary = await KhataService.getFinancialSummary(user.id);

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

    const buffer = await data.toBuffer();
    const result = await uploadSingleImage(buffer, 'khata');

    reply.send({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
      },
      message: 'Image uploaded successfully',
    });
  });
}

