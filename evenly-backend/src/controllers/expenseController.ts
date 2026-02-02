import { FastifyRequest, FastifyReply } from 'fastify';
import { ExpenseService } from '../services/expenseService';
import {
  createExpenseSchema,
  updateExpenseSchema,
  paginationSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type PaginationQuery
} from '../utils/validation';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/errors';
import { uploadSingleImage, deleteImage } from '../utils/cloudinary';

export class ExpenseController {
  /**
   * Create a new expense
   */
  static createExpense = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;

    // Handle multipart form data (for receipt image upload)
    let receiptUrl: string | undefined;
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
              console.log('Processing receipt image:', {
                fieldname: part.fieldname,
                filename: part.filename,
                mimetype: mimetype,
                bufferSize: buffer.length,
              });
              const result = await uploadSingleImage(buffer, 'expenses', mimetype);
              receiptUrl = result.url;
            } catch (uploadError) {
              console.error('Error uploading receipt image:', uploadError);
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

              // Map form fields to expense data
              if (fieldname === 'groupId') data.groupId = value;
              else if (fieldname === 'title') data.title = value;
              else if (fieldname === 'totalAmount') data.totalAmount = value;
              else if (fieldname === 'paidBy') data.paidBy = value;
              else if (fieldname === 'description') data.description = value;
              else if (fieldname === 'category') data.category = value;
              else if (fieldname === 'date') data.date = value;
              else if (fieldname === 'splitType') data.splitType = value;
              else if (fieldname === 'splits') {
                // Parse JSON string for splits array
                try {
                  data.splits = JSON.parse(value as string);
                } catch (e) {
                  console.error('Error parsing splits:', e);
                }
              }
            } catch (fieldError) {
              console.error('Error reading form field:', fieldError);
            }
          }
        }

        // Add receipt URL if uploaded
        if (receiptUrl) {
          data.receipt = receiptUrl;
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
      Object.assign(data, request.body);
    }

    // Validate the expense data
    const expenseData = createExpenseSchema.parse(data);

    const expense = await ExpenseService.createExpense(expenseData, user.id);

    reply.status(201).send({
      success: true,
      data: expense,
      message: 'Expense created successfully',
    });
  });

  /**
   * Get expense by ID
   */
  static getExpenseById = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { expenseId } = request.params as { expenseId: string };

    const expense = await ExpenseService.getExpenseById(expenseId, organizationId);
    if (!expense) {
      return reply.status(404).send({
        success: false,
        message: 'Expense not found',
      });
    }

    reply.send({
      success: true,
      data: expense,
      message: 'Expense retrieved successfully',
    });
  });

  /**
   * Get group expenses
   */
  static getGroupExpenses = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { groupId } = request.params as { groupId: string };
    const query = paginationSchema.parse(request.query);

    const result = await ExpenseService.getGroupExpenses(groupId, user.id, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      organizationId,
    });

    reply.send({
      success: true,
      data: result.expenses,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
        hasNext: query.page * query.limit < result.total,
        hasPrev: query.page > 1,
      },
      message: 'Group expenses retrieved successfully',
    });
  });

  /**
   * Update expense
   */
  static updateExpense = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { expenseId } = request.params as { expenseId: string };
    const updateData = updateExpenseSchema.parse(request.body);

    const expense = await ExpenseService.updateExpense(expenseId, updateData, user.id, organizationId);

    reply.send({
      success: true,
      data: expense,
      message: 'Expense updated successfully',
    });
  });

  /**
   * Delete expense
   */
  static deleteExpense = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const { expenseId } = request.params as { expenseId: string };

    await ExpenseService.deleteExpense(expenseId, user.id, organizationId);

    reply.send({
      success: true,
      message: 'Expense deleted successfully',
    });
  });

  /**
   * Get expense categories
   */
  static getExpenseCategories = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await ExpenseService.getExpenseCategories();

    reply.send({
      success: true,
      data: categories,
      message: 'Expense categories retrieved successfully',
    });
  });

  /**
   * Get user's expenses across all groups
   */
  static getUserExpenses = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { user } = request as AuthenticatedRequest;
    const organizationId = (request as any).organizationId;
    const query = paginationSchema.parse(request.query);

    // TODO: Implement getUserExpenses in ExpenseService
    const expenses: any[] = [];

    reply.send({
      success: true,
      data: expenses,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      message: 'User expenses retrieved successfully',
    });
  });

  /**
   * Delete expense image from Cloudinary
   */
  static deleteExpenseImage = asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
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

      console.log('Deleting image from Cloudinary:', {
        imageUrl,
        publicId,
      });

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
      console.error('Error deleting expense image:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete image',
      });
    }
  });
}
