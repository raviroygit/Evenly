import { FastifyRequest } from 'fastify';

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phoneNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthenticatedUser extends User {
  iat?: number;
  exp?: number;
}

// Group Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  defaultSplitType: SplitType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  user?: User;
}

// Expense Types
export type SplitType = 'equal' | 'percentage' | 'shares' | 'exact';

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  totalAmount: number;
  currency: string;
  paidBy: string;
  splitType: SplitType;
  category: string;
  date: Date;
  receipt?: string;
  createdAt: Date;
  updatedAt: Date;
  paidByUser?: User;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
  user?: User;
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

// Balance Types
export interface UserBalance {
  userId: string;
  groupId: string;
  balance: number; // Positive = owed to user, Negative = user owes
  lastUpdated: Date;
  user?: User;
}

export interface SimplifiedDebt {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUser?: User;
  toUser?: User;
}

// Payment Types
export interface Payment {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  amount: number;
  currency: string;
  description?: string;
  status: PaymentStatus;
  createdAt: Date;
  completedAt?: Date;
  fromUser?: User;
  toUser?: User;
}

export type PaymentStatus = 'pending' | 'completed' | 'cancelled';

// API Request/Response Types
export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error Types
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  details?: any;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Auth Service Types
export interface AuthServiceResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Database Query Types
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
}
