// App Constants
export const APP_CONFIG = {
  name: 'EvenlySplit',
  version: '1.0.0',
  description: 'Manage your finances with style',
} as const;

// Theme Constants
export const THEME = {
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

// Tab Configuration
export const TAB_CONFIG = [
  {
    name: 'index',
    title: 'Home',
    icon: 'house.fill',
    drawable: 'ic_menu_mylocation',
  },
  {
    name: 'expenses',
    title: 'Expenses',
    icon: 'gearshape.arrow.trianglehead.2.clockwise.rotate.90',
    drawable: 'ic_menu_manage',
  },
  {
    name: 'groups',
    title: 'Groups',
    icon: 'person.3.fill',
    drawable: 'ic_menu_share',
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: 'person.circle.fill',
    drawable: 'ic_menu_account',
  },
] as const;

// Expense Categories
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food', icon: '🍽️', color: '#FF6B6B' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#4ECDC4' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#45B7D1' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#96CEB4' },
  { id: 'health', name: 'Health', icon: '🏥', color: '#FFEAA7' },
  { id: 'education', name: 'Education', icon: '📚', color: '#DDA0DD' },
  { id: 'income', name: 'Income', icon: '💰', color: '#98D8C8' },
] as const;

// Group Colors
export const GROUP_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30',
  '#AF52DE', '#FF2D92', '#5AC8FA', '#FFCC00',
] as const;
