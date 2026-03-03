import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import { authenticateToken } from '../middlewares/auth';
import { registerPushToken, unregisterPushToken, sendBroadcastPush } from '../services/pushNotificationService';
import { uploadSingleImage } from '../utils/cloudinary';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError } from '../utils/errors';

export async function pushNotificationRoutes(fastify: FastifyInstance) {
  // Register multipart for broadcast image uploads
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 1,
    },
  });
  // POST /register-token — register an Expo push token for the authenticated user
  fastify.post('/register-token', {
    preHandler: authenticateToken,
    schema: {
      description: 'Register a push notification token for the current user',
      tags: ['Notifications'],
      body: {
        type: 'object',
        required: ['token', 'platform'],
        properties: {
          token: { type: 'string' },
          platform: { type: 'string', enum: ['ios', 'android'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, platform } = request.body as { token: string; platform: string };
    const userId = (request as AuthenticatedRequest).user.id;

    await registerPushToken(userId, token, platform);

    return reply.send({ success: true, message: 'Push token registered' });
  });

  // POST /unregister-token — unregister an Expo push token
  fastify.post('/unregister-token', {
    preHandler: authenticateToken,
    schema: {
      description: 'Unregister a push notification token for the current user',
      tags: ['Notifications'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.body as { token: string };
    const userId = (request as AuthenticatedRequest).user.id;

    await unregisterPushToken(userId, token);

    return reply.send({ success: true, message: 'Push token unregistered' });
  });

  // POST /broadcast — send push notification to all users (admin/owner only)
  // Supports both JSON (with imageUrl) and multipart/form-data (with image file upload)
  fastify.post('/broadcast', {
    preHandler: authenticateToken,
    schema: {
      description: 'Broadcast a push notification to all users (admin/owner only). Supports JSON or multipart/form-data with image upload.',
      tags: ['Notifications'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            sent: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const organizationRole = (request as any).organizationRole;

    if (organizationRole !== 'owner' && organizationRole !== 'admin') {
      throw new ForbiddenError('Only organization owners and admins can broadcast notifications');
    }

    let title = '';
    let body = '';
    let imageUrl: string | undefined;

    const isMultipart = request.isMultipart();

    if (isMultipart) {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          const buffer = await part.toBuffer();
          const result = await uploadSingleImage(buffer, 'broadcasts', part.mimetype);
          imageUrl = result.url;
        } else {
          const value = typeof part.value === 'string' ? part.value : String(part.value);
          if (part.fieldname === 'title') title = value;
          else if (part.fieldname === 'body') body = value;
        }
      }
    } else {
      const data = request.body as { title: string; body: string; imageUrl?: string };
      title = data.title;
      body = data.body;
      imageUrl = data.imageUrl;
    }

    if (!title || !title.trim()) {
      return reply.status(400).send({ success: false, message: 'Title is required' });
    }
    if (!body || !body.trim()) {
      return reply.status(400).send({ success: false, message: 'Message body is required' });
    }

    const result = await sendBroadcastPush(title.trim(), body.trim(), imageUrl);

    return reply.send({
      success: true,
      message: `Broadcast sent to ${result.sent} device(s)`,
      sent: result.sent,
    });
  });
}
