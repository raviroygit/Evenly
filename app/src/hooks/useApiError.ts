import { useState, useCallback } from 'react';
import ErrorHandler from '../utils/ErrorHandler';

interface UseApiErrorReturn {
  error: any;
  isError: boolean;
  handleError: (error: any) => void;
  clearError: () => void;
  showErrorAlert: (error: any, onAction?: () => void) => void;
  showErrorWithRetry: (error: any, onRetry?: () => void) => void;
}

export const useApiError = (): UseApiErrorReturn => {
  const [error, setError] = useState<any>(null);

  const handleError = useCallback((error: any) => {
    ErrorHandler.logError(error, 'Component Error');
    setError(error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const showErrorAlert = useCallback((error: any, onAction?: () => void) => {
    ErrorHandler.showErrorAlert(error, onAction);
  }, []);

  const showErrorWithRetry = useCallback((error: any, onRetry?: () => void) => {
    ErrorHandler.showErrorWithRetry(error, onRetry);
  }, []);

  return {
    error,
    isError: !!error,
    handleError,
    clearError,
    showErrorAlert,
    showErrorWithRetry,
  };
};

export default useApiError;
