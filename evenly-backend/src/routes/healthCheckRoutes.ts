import { FastifyInstance } from 'fastify';
import {
  startHealthCheckController,
  stopHealthCheckController,
  getHealthCheckStatusController,
  manualHealthCheckController,
} from '../controllers/healthCheckController';

/**
 * @swagger
 * /api/v1/health/start:
 *   post:
 *     summary: Start scheduled health checks
 *     description: Start the health check service that calls the health endpoint every 2 minutes
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Health check service started successfully
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
 *                   example: "Health check service started successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isRunning:
 *                       type: boolean
 *                       example: true
 *                     intervalMs:
 *                       type: number
 *                       example: 120000
 *                     targetUrl:
 *                       type: string
 *                       example: "https://b98351f842e5.ngrok-free.app/health"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/health/stop:
 *   post:
 *     summary: Stop scheduled health checks
 *     description: Stop the health check service
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Health check service stopped successfully
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
 *                   example: "Health check service stopped successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isRunning:
 *                       type: boolean
 *                       example: false
 *                     intervalMs:
 *                       type: number
 *                       example: 120000
 *                     targetUrl:
 *                       type: string
 *                       example: "https://b98351f842e5.ngrok-free.app/health"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/health/status:
 *   get:
 *     summary: Get health check service status
 *     description: Get the current status of the health check service
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Health check service status retrieved successfully
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
 *                   example: "Health check service status retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     isRunning:
 *                       type: boolean
 *                       example: true
 *                     intervalMs:
 *                       type: number
 *                       example: 120000
 *                     targetUrl:
 *                       type: string
 *                       example: "https://b98351f842e5.ngrok-free.app/health"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/v1/health/manual-check:
 *   post:
 *     summary: Perform manual health check
 *     description: Perform a single health check immediately
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Manual health check completed
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
 *                   example: "Manual health check completed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     responseTime:
 *                       type: number
 *                       example: 150
 *                     status:
 *                       type: string
 *                       example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
export async function healthCheckRoutes(fastify: FastifyInstance) {
  // Start health check service
  fastify.post('/api/v1/health/start', startHealthCheckController);

  // Stop health check service
  fastify.post('/api/v1/health/stop', stopHealthCheckController);

  // Get health check service status
  fastify.get('/api/v1/health/status', getHealthCheckStatusController);

  // Perform manual health check
  fastify.post('/api/v1/health/manual-check', manualHealthCheckController);
}
