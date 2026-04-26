import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import { AuthStorage } from '../utils/storage';

/**
 * Direct client for the NxtGenAiDev Auth service.
 *
 * Separate from `evenlyApiClient` because:
 *  - Different base URL (auth service host, not Evenly backend).
 *  - Different auth model (no API key concept; pure JWT bearer).
 *  - Used pre-login: must NOT depend on stored tokens for `send-otp`.
 *
 * X-Organization-Id is sent on every request (required by the service).
 * Authorization is attached only when an accessToken is present, so
 * pre-login calls (`send-otp`, `verify-otp`) work for unauthenticated users
 * while authenticated calls (`/auth/me`, `/auth/logout`, `/refresh-token`
 * with explicit body) still get the bearer header where applicable.
 */
class AuthApiClient {
  private client: AxiosInstance;

  constructor() {
    const base = (ENV.AUTH_SERVICE_URL || '').replace(/\/+$/, '');
    this.client = axios.create({
      baseURL: base,
      timeout: 60000,
      headers: {
        Accept: 'application/json',
        'x-client-type': 'mobile',
      },
    });

    this.client.interceptors.request.use(async (config) => {
      config.headers = config.headers || {};

      if (ENV.ORGANIZATION_ID) {
        config.headers['X-Organization-Id'] = ENV.ORGANIZATION_ID;
      }

      // Multipart: let axios pick the boundary on iOS; force the header on Android
      // (axios there sometimes mislabels FormData as urlencoded).
      if (config.data instanceof FormData) {
        if (Platform.OS === 'android') {
          config.headers['Content-Type'] = 'multipart/form-data';
        } else {
          delete (config.headers as any)['Content-Type'];
        }
      } else if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      try {
        const authData = await AuthStorage.getAuthData();
        if (authData?.accessToken) {
          config.headers['Authorization'] = `Bearer ${authData.accessToken}`;
        }
      } catch {
        // pre-login or storage unavailable — proceed without auth header
      }

      return config;
    });

    return this;
  }

  request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.client.request<T>(config).then((r) => r.data);
  }
}

export const authApiClient = new AuthApiClient();
export default authApiClient;
