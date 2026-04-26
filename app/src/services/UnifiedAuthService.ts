import axios from 'axios';
import { ENV } from '../config/env';
import { authApiClient } from './AuthApiClient';

export type OtpChannel = 'email' | 'whatsapp' | 'both';

export interface SendOtpInput {
  email?: string;
  phoneNumber?: string;
  channel?: OtpChannel;
}

export interface SendOtpUserFlags {
  hasName: boolean;
  hasEmail: boolean;
  hasPhoneNumber: boolean;
  hasAvatar: boolean;
}

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  intent?: 'login' | 'signup';
  method?: OtpChannel;
  channels?: string[];
  appName?: string;
  emailSender?: string;
  whatsappSender?: string;
  email?: string;
  phoneNumber?: string;
  user?: SendOtpUserFlags | null;
  organization?: { id: string; name: string; displayName?: string; domainIdentifier?: string };
}

export interface VerifyOtpInput {
  email?: string;
  phoneNumber?: string;
  otp: string;
  name?: string;
  avatar?: string;
  /** When provided, the request is sent as multipart/form-data with the file part. */
  file?: { uri: string; name: string; type: string };
}

export interface VerifyOtpUser {
  id: string;
  email?: string | null;
  phoneNumber?: string | null;
  name?: string;
  isVerified?: boolean;
  role?: string;
  avatar?: string | null;
}

export interface VerifyOtpOrganization {
  id: string;
  name: string;
  displayName?: string;
  domainIdentifier?: string;
  role?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  method?: OtpChannel;
  accessToken?: string;
  refreshToken?: string;
  user?: VerifyOtpUser;
  organization?: VerifyOtpOrganization;
}

export interface RefreshTokensResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: VerifyOtpUser;
}

const SEND_OTP_PATH = '/api/v1/auth/auth/send-otp';
const VERIFY_OTP_PATH = '/api/v1/auth/auth/verify-otp';
const REFRESH_TOKEN_PATH = '/api/v1/auth/refresh-token';
const LOGOUT_PATH = '/api/v1/auth/logout';

export class UnifiedAuthService {
  static async sendOtp(input: SendOtpInput): Promise<SendOtpResponse> {
    return authApiClient.request<SendOtpResponse>({
      method: 'POST',
      url: SEND_OTP_PATH,
      data: input,
    });
  }

  static async verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResponse> {
    if (input.file) {
      const fd = new FormData();
      if (input.email) fd.append('email', input.email);
      if (input.phoneNumber) fd.append('phoneNumber', input.phoneNumber);
      fd.append('otp', input.otp);
      if (input.name) fd.append('name', input.name);
      // React Native FormData expects { uri, name, type } for file parts.
      fd.append('file', input.file as any);
      return authApiClient.request<VerifyOtpResponse>({
        method: 'POST',
        url: VERIFY_OTP_PATH,
        data: fd,
      });
    }

    const body: Record<string, string> = { otp: input.otp };
    if (input.email) body.email = input.email;
    if (input.phoneNumber) body.phoneNumber = input.phoneNumber;
    if (input.name) body.name = input.name;
    if (input.avatar) body.avatar = input.avatar;

    return authApiClient.request<VerifyOtpResponse>({
      method: 'POST',
      url: VERIFY_OTP_PATH,
      data: body,
    });
  }

  /**
   * Direct refresh against the auth service. Avoids the singleton client so we
   * never accidentally attach a stale access token in the Authorization header
   * during a refresh (the spec requires only the refreshToken in the body).
   */
  static async refreshTokens(refreshToken: string): Promise<RefreshTokensResponse> {
    const base = (ENV.AUTH_SERVICE_URL || '').replace(/\/+$/, '');
    const res = await axios.post(
      `${base}${REFRESH_TOKEN_PATH}`,
      { refreshToken },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-client-type': 'mobile',
          ...(ENV.ORGANIZATION_ID ? { 'X-Organization-Id': ENV.ORGANIZATION_ID } : {}),
        },
      }
    );
    return res.data;
  }

  /**
   * Direct logout against the auth service. Invalidates the user's refresh
   * token + active sessions per the spec. Best-effort — we always continue
   * with local cleanup even if this call fails (network/cold-start).
   */
  static async logoutDirect(accessToken: string): Promise<void> {
    const base = (ENV.AUTH_SERVICE_URL || '').replace(/\/+$/, '');
    await axios.post(
      `${base}${LOGOUT_PATH}`,
      {},
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-client-type': 'mobile',
          Authorization: `Bearer ${accessToken}`,
          ...(ENV.ORGANIZATION_ID ? { 'X-Organization-Id': ENV.ORGANIZATION_ID } : {}),
        },
      }
    );
  }
}

/** Compose an E.164 phone string from a country code (`+91`) and digits-only local part. */
export function composeE164(countryCode: string, localDigits: string): string {
  const digits = localDigits.replace(/\D/g, '');
  if (!digits) return '';
  return `${countryCode}${digits}`;
}

/** Heuristic: presence of `@` decides email vs phone for the unified identifier input. */
export function isEmailIdentifier(value: string): boolean {
  return value.includes('@');
}

/** React Native fetch-style file part for `verify-otp` multipart uploads. */
export function buildAvatarFilePart(uri: string): { uri: string; name: string; type: string } {
  const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  // iOS picker URIs are file://; Android may be content://. Both work in RN FormData.
  const name = `avatar.${ext === 'jpg' ? 'jpg' : ext}`;
  return { uri, name, type: mime };
}
