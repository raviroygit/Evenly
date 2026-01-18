// Core Types - Updated
export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  stats: UserStats;
}

export interface UserStats {
  groups: number;
  totalSpent: number;
  owed: number;
}

// Expense Types
export interface Expense {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  totalAmount: number;
  currency: string;
  paidBy: string;
  paidByUser?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  splitType: 'equal' | 'percentage' | 'shares' | 'exact';
  category: string;
  date: Date;
  receipt?: string;
  createdAt: Date;
  updatedAt: Date;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

// Enhanced Expense Display Types
export interface ExpenseShare {
  userId: string;
  userName: string;
  amount: number;
  status: 'owes' | 'gets'; // Whether they owe money or get money back
  isCurrentUser: boolean;
}

export interface CurrentUserShare {
  amount: number;
  status: 'lent' | 'borrowed' | 'even';
  color: string;
}

export interface NetBalance {
  amount: number;
  status: 'positive' | 'negative' | 'zero';
  text: string;
  color: string;
}

export interface EnhancedExpense extends Expense {
  paidByDisplay: string;
  sharesList: ExpenseShare[];
  currentUserShare: CurrentUserShare;
  netBalance: NetBalance;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  defaultSplitType: 'equal' | 'percentage' | 'shares' | 'exact';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
}

// Balance Types
export interface UserBalance {
  id: string;
  userId: string;
  groupId: string;
  balance: number;
  lastUpdated: Date;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

export interface SimplifiedDebt {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  toUser?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

// Payment Types
export interface Payment {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  description?: string;
  createdAt: Date;
  completedAt?: Date;
  fromUser: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
  toUser: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

// Navigation Types
export interface TabRoute {
  name: string;
  title: string;
  icon: string;
  badge?: string;
}

// Theme Types
export type ThemeMode = 'light' | 'dark';

// Component Props Types
export interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
  padding?: number;
  marginBottom?: number;
}

export interface GlassListItemProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  style?: any;
}
