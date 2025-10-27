import { Alert } from 'react-native';
import { AxiosError } from 'axios';

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
}

export class ErrorHandler {
  static handleApiError(error: any): UserFriendlyError {
    // Handle Axios errors
    if (error.isAxiosError) {
      const axiosError = error as AxiosError;
      
      // Network errors (no internet, server down, etc.)
      if (!axiosError.response) {
        return {
          title: 'Connection Problem',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          action: 'Retry'
        };
      }

      // HTTP status code errors
      switch (axiosError.response.status) {
        case 400:
          return {
            title: 'Invalid Request',
            message: 'The request was invalid. Please try again.',
            action: 'OK'
          };
        case 401:
          return {
            title: 'Authentication Required',
            message: 'Please log in again to continue.',
            action: 'Login'
          };
        case 403:
          return {
            title: 'Access Denied',
            message: 'You don\'t have permission to perform this action.',
            action: 'OK'
          };
        case 404:
          return {
            title: 'Not Found',
            message: 'The requested resource was not found.',
            action: 'OK'
          };
        case 429:
          return {
            title: 'Too Many Requests',
            message: 'You\'ve made too many requests. Please wait a moment and try again.',
            action: 'OK'
          };
        case 500:
          return {
            title: 'Server Error',
            message: 'Something went wrong on our end. Please try again later.',
            action: 'OK'
          };
        case 502:
        case 503:
        case 504:
          return {
            title: 'Service Unavailable',
            message: 'The service is temporarily unavailable. Please try again later.',
            action: 'Retry'
          };
        default:
          return {
            title: 'Request Failed',
            message: `Request failed with status ${axiosError.response.status}. Please try again.`,
            action: 'OK'
          };
      }
    }

    // Handle generic errors
    if (error.message) {
      // Check for specific error messages
      if (error.message.includes('Network Error')) {
        return {
          title: 'Network Error',
          message: 'Unable to connect to the server. Please check your internet connection.',
          action: 'Retry'
        };
      }
      
      if (error.message.includes('timeout')) {
        return {
          title: 'Request Timeout',
          message: 'The request took too long to complete. Please try again.',
          action: 'Retry'
        };
      }

      if (error.message.includes('ENOENT')) {
        return {
          title: 'File Not Found',
          message: 'A required file is missing. Please restart the app.',
          action: 'Restart App'
        };
      }
    }

    // Default error
    return {
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      action: 'OK'
    };
  }

  static showErrorAlert(error: any, onAction?: () => void) {
    const userFriendlyError = this.handleApiError(error);
    
    Alert.alert(
      userFriendlyError.title,
      userFriendlyError.message,
      [
        {
          text: userFriendlyError.action || 'OK',
          onPress: onAction,
        },
      ],
      { cancelable: false }
    );
  }

  static showErrorWithRetry(error: any, onRetry?: () => void) {
    const userFriendlyError = this.handleApiError(error);
    
    const buttons = [
      {
        text: 'Cancel',
        style: 'cancel' as const,
      },
    ];

    if (onRetry && (userFriendlyError.action === 'Retry' || userFriendlyError.action === 'OK')) {
      buttons.push({
        text: 'Retry',
        onPress: onRetry,
      });
    }

    Alert.alert(
      userFriendlyError.title,
      userFriendlyError.message,
      buttons,
      { cancelable: false }
    );
  }

  static logError(error: any, context?: string) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context: context || 'Unknown',
      error: error.message || 'Unknown error',
      stack: error.stack,
      isAxiosError: error.isAxiosError,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : null,
    };

    console.error(`[ErrorHandler] ${context || 'Error'}:`, errorInfo);
    
    // In production, you might want to send this to a logging service
    // this.sendToLoggingService(errorInfo);
  }
}

export default ErrorHandler;
