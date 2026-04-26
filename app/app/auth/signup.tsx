import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function SignupPage() {
  const { referralCode } = useLocalSearchParams<{ referralCode?: string }>();
  const target = referralCode ? `/auth?referralCode=${encodeURIComponent(referralCode)}` : '/auth';
  return <Redirect href={target as any} />;
}
