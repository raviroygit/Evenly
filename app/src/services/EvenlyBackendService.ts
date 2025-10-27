import { Group, Expense, EnhancedExpense } from '../types';
import { ENV } from '../config/env';
import { evenlyApiClient } from './EvenlyApiClient';

const EVENLY_BACKEND_URL = ENV.EVENLY_BACKEND_URL;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface GroupResponse {
  id: string;
  name: string;
  description?: string;
  currency: string;
  defaultSplitType: 'equal' | 'percentage' | 'shares' | 'exact';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

interface ExpenseResponse {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  totalAmount: string;
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
  date: string;
  receipt?: string;
  createdAt: string;
  updatedAt: string;
  splits: {
    id: string;
    expenseId: string;
    userId: string;
    amount: string;
    percentage?: number;
    shares?: number;
    createdAt: string;
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
    };
  }[];
}

interface BalanceResponse {
  id: string;
  userId: string;
  groupId: string;
  balance: string;
  lastUpdated: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

interface SimplifiedDebt {
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

interface PaymentResponse {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  description?: string;
  createdAt: string;
  completedAt?: string;
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

export class EvenlyBackendService {
  /**
   * Test connection to the backend
   */
  static async testConnection(): Promise<boolean> {
    try {
      // Health endpoint is at root level, not under /api
      const baseUrl = EVENLY_BACKEND_URL.replace('/api', '');
      
      // Use Axios for consistency
      const response = await evenlyApiClient.getInstance().request({
        method: 'GET',
        url: '/health',
        baseURL: baseUrl,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      return response.data.status === 'ok';
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      // Convert RequestInit to Axios config
      const axiosConfig: any = {
        method: options.method || 'GET',
        ...options,
      };

      // Handle body for POST/PUT requests
      if (options.body) {
        axiosConfig.data = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      }

      // Use the Axios client with automatic authentication
      const response = await evenlyApiClient.getInstance().request<ApiResponse<T>>({
        url: endpoint,
        ...axiosConfig,
      });

      return response.data;
    } catch (error: any) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }


  // Groups API
  static async getGroups(): Promise<Group[]> {
    const response = await this.makeRequest<GroupResponse[]>('/groups');
    return response.data.map(this.mapGroupResponse);
  }

  static async createGroup(groupData: {
    name: string;
    description?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }): Promise<Group> {
    
    const response = await this.makeRequest<GroupResponse>('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
    return this.mapGroupResponse(response.data);
  }

  static async getGroupById(groupId: string): Promise<Group> {
    const response = await this.makeRequest<GroupResponse>(`/groups/${groupId}`);
    return this.mapGroupResponse(response.data);
  }

  static async updateGroup(groupId: string, groupData: {
    name?: string;
    description?: string;
    currency?: string;
    defaultSplitType?: 'equal' | 'percentage' | 'shares' | 'exact';
  }): Promise<Group> {
    const response = await this.makeRequest<GroupResponse>(`/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
    return this.mapGroupResponse(response.data);
  }

  static async deleteGroup(groupId: string): Promise<void> {
    await this.makeRequest(`/groups/${groupId}`, {
      method: 'DELETE',
    });
  }

  static async getGroupMembers(groupId: string): Promise<any[]> {
    const response = await this.makeRequest<any[]>(`/groups/${groupId}/members`);
    return response.data;
  }

  static async addGroupMember(groupId: string, email: string, role: 'admin' | 'member' = 'member'): Promise<any> {
    const response = await this.makeRequest<any>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    return response.data;
  }

  static async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await this.makeRequest(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Expenses API
  static async getGroupExpenses(groupId: string, options: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ expenses: EnhancedExpense[]; pagination: any }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const queryString = params.toString();
    const endpoint = `/expenses/group/${groupId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<EnhancedExpense[]>(endpoint);
    return {
      expenses: response.data, // Backend already returns enhanced data, no mapping needed
      pagination: response.pagination,
    };
  }

  static async getAllExpenses(options: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ expenses: EnhancedExpense[]; pagination: any }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const queryString = params.toString();
    const endpoint = `/expenses/user${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<EnhancedExpense[]>(endpoint);
    return {
      expenses: response.data,
      pagination: response.pagination,
    };
  }

  static async createExpense(expenseData: {
    groupId: string;
    title: string;
    description?: string;
    totalAmount: string;
    paidBy?: string; // Optional - backend will set from authenticated user
    splitType: 'equal' | 'percentage' | 'shares' | 'exact';
    category: string;
    date: string;
    receipt?: string;
    splits?: { // Optional - backend will auto-generate
      userId: string;
      amount: string;
      percentage?: string;
      shares?: number;
    }[];
  }): Promise<Expense> {
    const response = await this.makeRequest<ExpenseResponse>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    return this.mapExpenseResponse(response.data);
  }

  static async getExpenseById(expenseId: string): Promise<Expense> {
    const response = await this.makeRequest<ExpenseResponse>(`/expenses/${expenseId}`);
    return this.mapExpenseResponse(response.data);
  }

  static async updateExpense(expenseId: string, expenseData: {
    title?: string;
    description?: string;
    totalAmount?: string;
    category?: string;
    date?: string;
    receipt?: string;
    splits?: {
      userId: string;
      amount: string;
      percentage?: string;
      shares?: number;
    }[];
  }): Promise<Expense> {
    const response = await this.makeRequest<ExpenseResponse>(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
    return this.mapExpenseResponse(response.data);
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    await this.makeRequest(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Balances API
  static async getGroupBalances(groupId: string): Promise<BalanceResponse[]> {
    const response = await this.makeRequest<BalanceResponse[]>(`/balances/group/${groupId}`);
    return response.data;
  }

  static async getSimplifiedDebts(groupId: string): Promise<SimplifiedDebt[]> {
    const response = await this.makeRequest<SimplifiedDebt[]>(`/balances/group/${groupId}/simplified-debts`);
    return response.data;
  }

  static async getUserBalances(): Promise<BalanceResponse[]> {
    const response = await this.makeRequest<BalanceResponse[]>('/balances/user');
    return response.data;
  }

  static async getUserNetBalance(): Promise<{
    totalOwed: number;
    totalOwing: number;
    netBalance: number;
  }> {
    const response = await this.makeRequest<{
      totalOwed: number;
      totalOwing: number;
      netBalance: number;
    }>('/balances/user/net');
    return response.data;
  }

  // Payments API
  static async getGroupPayments(groupId: string, options: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'completed' | 'cancelled';
  } = {}): Promise<{ payments: PaymentResponse[]; pagination: any }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);

    const queryString = params.toString();
    const endpoint = `/payments/group/${groupId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<PaymentResponse[]>(endpoint);
    return {
      payments: response.data,
      pagination: response.pagination,
    };
  }

  static async getUserPayments(options: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'completed' | 'cancelled';
    type?: 'sent' | 'received';
  } = {}): Promise<{ payments: PaymentResponse[]; pagination: any }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);
    if (options.type) params.append('type', options.type);

    const queryString = params.toString();
    const endpoint = `/payments/user${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<PaymentResponse[]>(endpoint);
    return {
      payments: response.data,
      pagination: response.pagination,
    };
  }

  static async createPayment(paymentData: {
    groupId: string;
    toUserId: string;
    amount: string;
    currency?: string;
    description?: string;
  }): Promise<PaymentResponse> {
    const response = await this.makeRequest<PaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return response.data;
  }

  static async updatePaymentStatus(paymentId: string, status: 'completed' | 'cancelled'): Promise<PaymentResponse> {
    const response = await this.makeRequest<PaymentResponse>(`/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.data;
  }

  // Helper methods to map API responses to frontend types
  private static mapGroupResponse(group: GroupResponse): Group {
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      currency: group.currency,
      defaultSplitType: group.defaultSplitType,
      createdBy: group.createdBy,
      createdAt: new Date(group.createdAt),
      updatedAt: new Date(group.updatedAt),
      memberCount: group.memberCount,
    };
  }

  private static mapExpenseResponse(expense: ExpenseResponse): Expense {
    return {
      id: expense.id,
      groupId: expense.groupId,
      title: expense.title,
      description: expense.description,
      totalAmount: parseFloat(expense.totalAmount),
      currency: expense.currency,
      paidBy: expense.paidBy,
      paidByUser: expense.paidByUser ? {
        id: expense.paidByUser.id,
        email: expense.paidByUser.email,
        name: expense.paidByUser.name,
        avatar: expense.paidByUser.avatar,
      } : undefined,
      splitType: expense.splitType,
      category: expense.category,
      date: new Date(expense.date),
      receipt: expense.receipt,
      createdAt: new Date(expense.createdAt),
      updatedAt: new Date(expense.updatedAt),
      splits: expense.splits.map(split => ({
        id: split.id,
        expenseId: split.expenseId,
        userId: split.userId,
        amount: parseFloat(split.amount),
        percentage: split.percentage,
        shares: split.shares,
        createdAt: new Date(split.createdAt),
        user: {
          id: split.user.id,
          email: split.user.email,
          name: split.user.name,
          avatar: split.user.avatar,
        },
      })),
    };
  }
}