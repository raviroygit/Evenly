import { FastifyInstance } from 'fastify';
import {
  appDownloadRedirect,
  openGroupRedirect,
  openExpenseRedirect,
  openKhataRedirect,
  getDeviceInfo,
  serveLogo,
} from '../controllers/appRedirectController';

export default async function appRedirectRoutes(fastify: FastifyInstance) {
  // App logo for link previews (WhatsApp/SMS) - show app logo instead of App Store screenshot
  fastify.get('/app/logo', serveLogo);

  // Smart app download redirect - detects device and redirects to appropriate store
  fastify.get('/app/download', appDownloadRedirect);

  // Smart app redirect to open specific group
  fastify.get('/app/open/group/:groupId', openGroupRedirect);

  // Smart app redirect to open expense (group context)
  fastify.get('/app/open/expense/:groupId', openExpenseRedirect);

  // Smart app redirect to open Khata section
  fastify.get('/app/open/khata', openKhataRedirect);

  // Device info endpoint (for testing/debugging)
  fastify.get('/app/device-info', getDeviceInfo);
}
