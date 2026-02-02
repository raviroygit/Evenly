import { FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config/config';

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

    const baseUrl = (config.app?.baseUrl || '').replace(/\/$/, '');
    const ogImageUrl = baseUrl ? `${baseUrl}/api/app/logo` : '';
    const ogUrl = baseUrl ? `${baseUrl}/api/app/download` : APP_STORE_URL;
    const ogTitle = 'EvenlySplit - Split expenses, share memories';

    html = html.replace(/__OG_IMAGE_URL__/g, ogImageUrl);
    html = html.replace(/__OG_TITLE__/g, ogTitle);
    html = html.replace(/__OG_URL__/g, ogUrl);

    // Inject context data into HTML
    html = html.replace(
      '<script>',
      `<script>
        window.DEEP_LINK_CONTEXT = ${JSON.stringify(context)};
      `
    );

    return reply.type('text/html').send(html);
  } catch {
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

  return serveSmartRedirect(reply, device, 'evenly://khata', {
    type: 'khata'
  });
}

/**
 * Serve app logo for Open Graph / link previews (WhatsApp, SMS)
 * GET /app/logo
 */
export async function serveLogo(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const logoPath = path.join(__dirname, '..', 'templates', 'logo.png');
  if (!fs.existsSync(logoPath)) {
    return reply.status(404).send({ error: 'Logo not found. Add templates/logo.png (copy from app/assets/icon.png).' });
  }
  return reply.type('image/png').send(fs.readFileSync(logoPath));
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
