# Route Protection System

This document explains the comprehensive route protection system implemented in the Evenly app.

## Overview

The app now has a robust authentication-based route protection system that prevents unauthorized access to protected routes and automatically redirects users to appropriate pages based on their authentication status.

## Components

### 1. ProtectedRoute
- **Location**: `src/components/auth/ProtectedRoute.tsx`
- **Purpose**: Wraps routes that require authentication
- **Behavior**: 
  - Shows loading screen while checking authentication
  - Redirects to `/auth/login` if user is not authenticated
  - Renders children only if user is authenticated

### 2. PublicRoute
- **Location**: `src/components/auth/PublicRoute.tsx`
- **Purpose**: Wraps routes that should be accessible without authentication
- **Behavior**:
  - Redirects to `/tabs` if user is already authenticated
  - Renders children only if user is not authenticated

### 3. Root Index Route
- **Location**: `app/index.tsx`
- **Purpose**: Entry point that determines initial routing
- **Behavior**:
  - Shows loading screen while checking authentication
  - Redirects to `/tabs` if authenticated
  - Redirects to `/auth/login` if not authenticated

## Route Structure

### Protected Routes (Require Authentication)
- `/tabs/*` - All tab-based routes (Home, Expenses, Groups, Profile)
- These routes are protected at the layout level using `ProtectedRoute`

### Public Routes (No Authentication Required)
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- These routes use `PublicRoute` to redirect authenticated users

## Implementation Details

### Authentication Flow
1. App starts at `/` (index.tsx)
2. Checks authentication status
3. Redirects to appropriate route based on auth status
4. Protected routes check auth status and redirect if needed
5. Public routes redirect authenticated users to main app

### Key Features
- **No Direct Access**: Users cannot directly access protected routes via URL
- **Automatic Redirects**: Seamless redirection based on authentication status
- **Loading States**: Proper loading indicators during auth checks
- **Clean Architecture**: Centralized protection logic with reusable components

## Usage Examples

### Protecting a New Route
```tsx
import { ProtectedRoute } from '../src/components/auth/ProtectedRoute';

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <MyPageContent />
    </ProtectedRoute>
  );
}
```

### Creating a Public Route
```tsx
import { PublicRoute } from '../src/components/auth/PublicRoute';

export default function MyPublicPage() {
  return (
    <PublicRoute>
      <MyPublicContent />
    </PublicRoute>
  );
}
```

## Security Benefits

1. **Prevents Unauthorized Access**: Users cannot bypass authentication by directly accessing URLs
2. **Consistent Behavior**: All protected routes behave the same way
3. **Automatic Session Management**: Handles authentication state changes gracefully
4. **User Experience**: Smooth transitions between authenticated and unauthenticated states

## Testing

To test the route protection:

1. **Without Authentication**:
   - Try accessing `/tabs` directly - should redirect to `/auth/login`
   - Try accessing `/tabs/profile` directly - should redirect to `/auth/login`

2. **With Authentication**:
   - Try accessing `/auth/login` - should redirect to `/tabs`
   - Try accessing `/auth/signup` - should redirect to `/tabs`

3. **Navigation Flow**:
   - Login should redirect to `/tabs`
   - Logout should redirect to `/auth/login`
   - App restart should maintain authentication state
