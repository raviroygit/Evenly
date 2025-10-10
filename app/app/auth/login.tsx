import React from 'react';
import { LoginScreen } from '../../src/features/auth/LoginScreen';
import { PublicRoute } from '../../src/components/auth/PublicRoute';

export default function LoginPage() {
  return (
    <PublicRoute>
      <LoginScreen />
    </PublicRoute>
  );
}
