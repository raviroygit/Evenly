import { useState, useEffect, useMemo } from 'react';
import { Payment } from '../types';
import { EvenlyBackendService } from '../services/EvenlyBackendService';

export const usePayments = (groupId?: string) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadGroupPayments(groupId);
    }
  }, [groupId]);

  const loadGroupPayments = async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { payments: paymentsData } = await EvenlyBackendService.getGroupPayments(groupId);
      setPayments(paymentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingPayments = useMemo(() => 
    payments.filter(payment => payment.status === 'pending'), 
    [payments]
  );

  const completedPayments = useMemo(() => 
    payments.filter(payment => payment.status === 'completed'), 
    [payments]
  );

  const totalPending = useMemo(() => 
    pendingPayments.reduce((sum, payment) => sum + payment.amount, 0), 
    [pendingPayments]
  );

  const totalCompleted = useMemo(() => 
    completedPayments.reduce((sum, payment) => sum + payment.amount, 0), 
    [completedPayments]
  );

  const createPayment = async (paymentData: {
    groupId: string;
    toUserId: string;
    amount: string;
    currency?: string;
    description?: string;
  }) => {
    try {
      setError(null);
      const newPayment = await EvenlyBackendService.createPayment(paymentData);
      setPayments(prev => [newPayment, ...prev]);
      return newPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: 'completed' | 'cancelled') => {
    try {
      setError(null);
      const updatedPayment = await EvenlyBackendService.updatePaymentStatus(paymentId, status);
      setPayments(prev => prev.map(payment => payment.id === paymentId ? updatedPayment : payment));
      return updatedPayment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    payments,
    loading,
    error,
    pendingPayments,
    completedPayments,
    totalPending,
    totalCompleted,
    createPayment,
    updatePaymentStatus,
    refreshPayments: groupId ? () => loadGroupPayments(groupId) : undefined,
  };
};

export const useUserPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserPayments();
  }, []);

  const loadUserPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const { payments: paymentsData } = await EvenlyBackendService.getUserPayments();
      setPayments(paymentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user payments');
      console.error('Error loading user payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const sentPayments = useMemo(() => 
    payments.filter(payment => payment.status === 'pending' || payment.status === 'completed'), 
    [payments]
  );

  const receivedPayments = useMemo(() => 
    payments.filter(payment => payment.status === 'pending' || payment.status === 'completed'), 
    [payments]
  );

  return {
    payments,
    loading,
    error,
    sentPayments,
    receivedPayments,
    refreshUserPayments: loadUserPayments,
  };
};
