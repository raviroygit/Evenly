import React from 'react';
import { UnifiedAuthScreen } from '../../src/features/auth/UnifiedAuthScreen';
import { PublicRoute } from '../../src/components/auth/PublicRoute';

export default function AuthPage() {
  return (
    <PublicRoute>
      <UnifiedAuthScreen />
    </PublicRoute>
  );
}
