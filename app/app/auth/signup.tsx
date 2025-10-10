import React from 'react';
import { SignupScreen } from '../../src/features/auth/SignupScreen';
import { PublicRoute } from '../../src/components/auth/PublicRoute';

export default function SignupPage() {
  return (
    <PublicRoute>
      <SignupScreen />
    </PublicRoute>
  );
}
