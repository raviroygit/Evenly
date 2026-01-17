import { FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';

/**
 * App Store URLs
 */
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.nxtgenaidev.evenly&hl=en_IN&pli=1';
const APP_STORE_URL = 'https://apps.apple.com/us/app/evenlysplit/id6756101586';
const WEB_FALLBACK_URL = 'https://www.evenly.app'; // Fallback for desktop browsers

/**
 * Detect device type from User-Agent
 */
function detectDevice(userAgent: string): 'android' | 'ios' | 'desktop' {
  const ua = userAgent.toLowerCase();

  // Check for Android
  if (ua.includes('android')) {
    return 'android';
  }

  // Check for iOS (iPhone, iPad, iPod)
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  }

  // Default to desktop
  return 'desktop';
}

/**
 * Helper function to serve smart redirect HTML with context
 */
function serveSmartRedirect(
  reply: FastifyReply,
  device: 'android' | 'ios' | 'desktop',
  deepLinkPath: string,
  context: {
    type: 'invitation' | 'group' | 'expense' | 'khata';
    data?: any;
  }
): FastifyReply {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'appRedirect.html');
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Inject context data into HTML
    const contextJson = JSON.stringify(context).replace(/'/g, "\\'");
    html = html.replace(
      '<script>',
      `<script>
        window.DEEP_LINK_CONTEXT = ${JSON.stringify(context)};
      `
    );

    return reply.type('text/html').send(html);
  } catch (error) {
    console.error('Error serving smart redirect:', error);

    // Fallback to store redirect
    let redirectUrl: string;
    switch (device) {
      case 'android':
        redirectUrl = PLAY_STORE_URL;
        break;
      case 'ios':
        redirectUrl = APP_STORE_URL;
        break;
      default:
        redirectUrl = WEB_FALLBACK_URL;
        break;
    }

    return reply.status(302).redirect(redirectUrl);
  }
}

/**
 * Smart app download redirect - tries to open app first, falls back to store
 * GET /app/download?token=invitationToken
 */
export async function appDownloadRedirect(
  request: FastifyRequest<{
    Querystring: {
      token?: string;
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  const userAgent = request.headers['user-agent'] || '';
  const device = detectDevice(userAgent);
  const invitationToken = request.query.token || '';

  console.log('App download request:', {
    userAgent,
    device,
    invitationToken: invitationToken ? 'present' : 'none',
    ip: request.ip
  });

  return serveSmartRedirect(reply, device, `evenly://invitation/${invitationToken}`, {
    type: 'invitation',
    data: { token: invitationToken }
  });
}

/**
 * Smart app redirect to open a specific group
 * GET /app/open/group/:groupId
 */
export async function openGroupRedirect(
  request: FastifyRequest<{
    Params: {
      groupId: string;
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  const userAgent = request.headers['user-agent'] || '';
  const device = detectDevice(userAgent);
  const { groupId } = request.params;

  console.log('Open group request:', {
    userAgent,
    device,
    groupId,
    ip: request.ip
  });

  return serveSmartRedirect(reply, device, `evenly://group/${groupId}`, {
    type: 'group',
    data: { groupId }
  });
}

/**
 * Smart app redirect to open a specific group (for expenses context)
 * GET /app/open/expense/:groupId
 */
export async function openExpenseRedirect(
  request: FastifyRequest<{
    Params: {
      groupId: string;
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  const userAgent = request.headers['user-agent'] || '';
  const device = detectDevice(userAgent);
  const { groupId } = request.params;

  console.log('Open expense/group request:', {
    userAgent,
    device,
    groupId,
    ip: request.ip
  });

  return serveSmartRedirect(reply, device, `evenly://group/${groupId}`, {
    type: 'expense',
    data: { groupId }
  });
}

/**
 * Smart app redirect to open Khata section
 * GET /app/open/khata
 */
export async function openKhataRedirect(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const userAgent = request.headers['user-agent'] || '';
  const device = detectDevice(userAgent);

  console.log('Open Khata request:', {
    userAgent,
    device,
    ip: request.ip
  });

  return serveSmartRedirect(reply, device, 'evenly://khata', {
    type: 'khata'
  });
}

/**
 * Get device info (for testing/debugging)
 * GET /app/device-info
 */
export async function getDeviceInfo(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<any> {
  const userAgent = request.headers['user-agent'] || '';
  const device = detectDevice(userAgent);

  let redirectUrl: string;
  switch (device) {
    case 'android':
      redirectUrl = PLAY_STORE_URL;
      break;
    case 'ios':
      redirectUrl = APP_STORE_URL;
      break;
    default:
      redirectUrl = WEB_FALLBACK_URL;
      break;
  }

  return reply.send({
    success: true,
    data: {
      userAgent,
      device,
      redirectUrl,
      stores: {
        playStore: PLAY_STORE_URL,
        appStore: APP_STORE_URL,
        web: WEB_FALLBACK_URL
      }
    }
  });
}
