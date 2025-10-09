import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSupportEmail } from '../services/emailService';
import { validateRequest } from '../utils/validation';
import { z } from 'zod';

// Validation schema for support request
const supportRequestSchema = z.object({
  userEmail: z.string().email('Invalid email address'),
  userName: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  category: z.enum(['technical', 'billing', 'feature', 'other']).optional().default('other'),
});

/**
 * Send support email from user to support team
 * POST /api/support/email
 */
export const sendSupportEmailController = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    // Validate request body
    const validationResult = validateRequest(supportRequestSchema, req.body);
    if (!validationResult.success) {
      return res.status(400).send({
        success: false,
        message: 'Validation failed',
        errors: validationResult.errors,
      });
    }

    const { userEmail, userName, subject, message, priority, category } = validationResult.data;

    // Send support email
    await sendSupportEmail(userEmail, userName, subject, message, priority, category);

    res.status(200).send({
      success: true,
      message: 'Support request sent successfully',
      data: {
        userEmail,
        subject,
        priority,
        category,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error in sendSupportEmailController:', error);
    
    res.status(500).send({
      success: false,
      message: 'Failed to send support request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Health check for support service
 * GET /api/support/health
 */
export const supportHealthCheck = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    res.status(200).send({
      success: true,
      message: 'Support service is healthy',
      timestamp: new Date().toISOString(),
      service: 'support',
      version: '1.0.0',
    });
  } catch (error: any) {
    console.error('Error in supportHealthCheck:', error);
    
    res.status(500).send({
      success: false,
      message: 'Support service health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};
