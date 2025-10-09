import { FastifyInstance } from 'fastify';
import { sendSupportEmailController, supportHealthCheck } from '../controllers/supportController';

/**
 * @swagger
 * /api/support/email:
 *   post:
 *     summary: Send support email
 *     description: Send a support request email from user to support team
 *     tags: [Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmail
 *               - userName
 *               - subject
 *               - message
 *             properties:
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "user@example.com"
 *               userName:
 *                 type: string
 *                 description: User's name
 *                 example: "John Doe"
 *               subject:
 *                 type: string
 *                 description: Support request subject
 *                 example: "App not working properly"
 *               message:
 *                 type: string
 *                 description: Support request message
 *                 example: "I'm experiencing issues with the app..."
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Priority level
 *                 example: "medium"
 *               category:
 *                 type: string
 *                 enum: [technical, billing, feature, other]
 *                 default: other
 *                 description: Support category
 *                 example: "technical"
 *     responses:
 *       200:
 *         description: Support request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Support request sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userEmail:
 *                       type: string
 *                       example: "user@example.com"
 *                     subject:
 *                       type: string
 *                       example: "App not working properly"
 *                     priority:
 *                       type: string
 *                       example: "medium"
 *                     category:
 *                       type: string
 *                       example: "technical"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to send support request"
 */
export default async function supportRoutes(fastify: FastifyInstance) {
  // Send support email endpoint
  fastify.post('/email', sendSupportEmailController);

  // Support health check endpoint
  fastify.get('/health', supportHealthCheck);
}
