import axios from 'axios';
import { config } from '../config/config';

interface HealthCheckResult {
  success: boolean;
  timestamp: string;
  responseTime: number;
  status?: string;
  error?: string;
}

export class HealthCheckService {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;
  private static readonly INTERVAL_MS = 2 * 60 * 1000; // 2 minutes in milliseconds

  /**
   * Start the scheduled health check service
   */
  static start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    
    // Run immediately on start
    this.performHealthCheck();
    
    // Then run every 2 minutes
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.INTERVAL_MS);
  }

  /**
   * Stop the scheduled health check service
   */
  static stop(): void {
    if (!this.isRunning) {
      return;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Perform a single health check
   */
  private static async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      const healthUrl = `${config.app.baseUrl}/health`;
      const response = await axios.get(healthUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Evenly-Backend-HealthCheck/1.0.0',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const responseTime = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        success: true,
        timestamp,
        responseTime,
        status: response.data?.status || 'unknown',
      };
      // Log additional details if available
      if (response.data) {
      }

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const result: HealthCheckResult = {
        success: false,
        timestamp,
        responseTime,
        error: error.message || 'Unknown error',
      };
      // Log additional error details
      if (error.response) {
      } else if (error.request) {
      }
    }
  }

  /**
   * Get the current status of the health check service
   */
  static getStatus(): { isRunning: boolean; intervalMs: number; targetUrl: string } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.INTERVAL_MS,
      targetUrl: `${config.app.baseUrl}/health`,
    };
  }

  /**
   * Perform a manual health check (for testing)
   */
  static async manualHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      const healthUrl = `${config.app.baseUrl}/health`;
      
      const response = await axios.get(healthUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Evenly-Backend-HealthCheck/1.0.0',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        timestamp,
        responseTime,
        status: response.data?.status || 'unknown',
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        timestamp,
        responseTime,
        error: error.message || 'Unknown error',
      };
    }
  }
}
