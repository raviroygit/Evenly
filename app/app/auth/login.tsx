import React from 'react';
import { Redirect } from 'expo-router';

export default function LoginPage() {
  // The two-screen split was replaced by a single unified passwordless screen.
  // Existing deep links / inline links to /auth/login still work via this redirect.
  return <Redirect href="/auth" />;
}
