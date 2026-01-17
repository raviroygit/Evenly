import { Group, Expense, EnhancedExpense } from '../types';
import { ENV } from '../config/env';
import { evenlyApiClient } from './EvenlyApiClient';
import { AppCache, defaultCacheKeyFromRequest } from '../utils/cache';

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
      const baseUrl = EVENLY_BACKEND_URL?.replace('/api', '') || '';
      
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

  // User API
  static async updateCurrentUser(update: { name?: string; email?: string }): Promise<ApiResponse<any>> {
    console.log('[EvenlyBackendService] ========== UPDATE USER REQUEST ==========');
    console.log('[EvenlyBackendService] updateCurrentUser called with:', JSON.stringify(update, null, 2));
    console.log('[EvenlyBackendService] Update object type:', typeof update);
    console.log('[EvenlyBackendService] Update keys:', Object.keys(update));
    console.log('[EvenlyBackendService] Update values:', Object.values(update));

    const response = await this.makeRequest<any>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(update),
      invalidatePrefixes: ['/auth/me', '/balances', '/groups', '/expenses']
    });

    console.log('[EvenlyBackendService] ========== UPDATE USER RESPONSE ==========');
    console.log('[EvenlyBackendService] Response:', JSON.stringify(response, null, 2));
    return response;
  }

  static async deleteCurrentUser(): Promise<ApiResponse<null>> {
    return await this.makeRequest<null>('/auth/me', {
      method: 'DELETE',
      invalidatePrefixes: ['/auth/me', '/balances', '/groups', '/expenses', '/payments']
    });
  }

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit & { cacheTTLMs?: number; cacheKey?: string; invalidatePrefixes?: string[]; transformRequest?: any } = {},
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
        // If it's FormData, pass it directly to axios
        if (options.body instanceof FormData) {
          axiosConfig.data = options.body;
          console.log('[makeRequest] Detected FormData body');
        } else {
          const parsedData = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          axiosConfig.data = parsedData;
          console.log('[makeRequest] Parsed body data:', JSON.stringify(parsedData, null, 2));
          console.log('[makeRequest] Data keys:', Object.keys(parsedData));
          console.log('[makeRequest] Data values:', Object.values(parsedData));
        }
      }

      // Optional GET cache lookup
      const methodUpper = (axiosConfig.method || 'GET').toUpperCase();
      const cacheTTLMs = options.cacheTTLMs;
      const bodyForKey = options.body
        ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body)
        : undefined;
      const computedCacheKey = options.cacheKey || defaultCacheKeyFromRequest(methodUpper, endpoint, bodyForKey);

      if (methodUpper === 'GET' && cacheTTLMs && cacheTTLMs > 0) {
        const cached = await AppCache.get<ApiResponse<T>>(computedCacheKey);
        if (cached) {
          return cached;
        }
      }

      // Use the Axios client with automatic authentication
      const response = await evenlyApiClient.getInstance().request<ApiResponse<T>>({
        url: endpoint,
        ...axiosConfig,
      });

      const data = response.data;

      // Optional GET cache write
      if (methodUpper === 'GET' && cacheTTLMs && cacheTTLMs > 0) {
        await AppCache.set<ApiResponse<T>>(computedCacheKey, data, cacheTTLMs);
      }

      // Optional cache invalidation on writes
      if (methodUpper !== 'GET' && options.invalidatePrefixes && options.invalidatePrefixes.length) {
        await AppCache.invalidateByPrefixes(options.invalidatePrefixes);
      }

      return data;
    } catch (error: any) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }


  // Groups API
  static async getGroups(options: { cacheTTLMs?: number } = {}): Promise<Group[]> {
    const response = await this.makeRequest<GroupResponse[]>('/groups', {
      cacheTTLMs: options.cacheTTLMs,
    });
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
      invalidatePrefixes: ['/groups', '/balances']
    });
    return this.mapGroupResponse(response.data);
  }

  static async getGroupById(groupId: string, options: { cacheTTLMs?: number } = {}): Promise<Group> {
    const response = await this.makeRequest<GroupResponse>(`/groups/${groupId}`, {
      cacheTTLMs: options.cacheTTLMs,
    });
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
      invalidatePrefixes: ['/groups', '/balances']
    });
    return this.mapGroupResponse(response.data);
  }

  static async deleteGroup(groupId: string): Promise<void> {
    await this.makeRequest(`/groups/${groupId}`, {
      method: 'DELETE',
      invalidatePrefixes: ['/groups', '/balances', '/expenses']
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
      invalidatePrefixes: ['/groups']
    });
    return response.data;
  }

  static async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await this.makeRequest(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
      invalidatePrefixes: ['/groups']
    });
  }

  // Expenses API
  static async getGroupExpenses(groupId: string, options: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
    cacheTTLMs?: number;
  } = {}): Promise<{ expenses: EnhancedExpense[]; pagination: any }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const queryString = params.toString();
    const endpoint = `/expenses/group/${groupId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<EnhancedExpense[]>(endpoint, {
      cacheTTLMs: options.cacheTTLMs,
    });
    return {
      expenses: response.data, // Backend already returns enhanced data, no mapping needed
      pagination: response.pagination,
    };
  }

  static async getAllExpenses(options: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
    cacheTTLMs?: number;
  } = {}): Promise<{ expenses: EnhancedExpense[]; pagination: any }> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const queryString = params.toString();
    const endpoint = `/expenses/user${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<EnhancedExpense[]>(endpoint, {
      cacheTTLMs: options.cacheTTLMs,
    });
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
      invalidatePrefixes: ['/expenses', '/balances']
    });
    return this.mapExpenseResponse(response.data);
  }

  static async getExpenseById(expenseId: string, options: { cacheTTLMs?: number } = {}): Promise<Expense> {
    const response = await this.makeRequest<ExpenseResponse>(`/expenses/${expenseId}`, {
      cacheTTLMs: options.cacheTTLMs,
    });
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
      invalidatePrefixes: ['/expenses', '/balances']
    });
    return this.mapExpenseResponse(response.data);
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    await this.makeRequest(`/expenses/${expenseId}`, {
      method: 'DELETE',
      invalidatePrefixes: ['/expenses', '/balances']
    });
  }

  // Balances API
  static async getGroupBalances(groupId: string, options: { cacheTTLMs?: number } = {}): Promise<BalanceResponse[]> {
    const response = await this.makeRequest<BalanceResponse[]>(`/balances/group/${groupId}`, {
      cacheTTLMs: options.cacheTTLMs,
    });
    return response.data;
  }

  static async getSimplifiedDebts(groupId: string, options: { cacheTTLMs?: number } = {}): Promise<SimplifiedDebt[]> {
    const response = await this.makeRequest<SimplifiedDebt[]>(`/balances/group/${groupId}/simplified-debts`, {
      cacheTTLMs: options.cacheTTLMs,
    });
    return response.data;
  }

  static async getUserBalances(options: { cacheTTLMs?: number } = {}): Promise<BalanceResponse[]> {
    const response = await this.makeRequest<BalanceResponse[]>('/balances/user', {
      cacheTTLMs: options.cacheTTLMs,
    });
    return response.data;
  }

  static async getUserNetBalance(options: { cacheTTLMs?: number } = {}): Promise<{
    totalOwed: number;
    totalOwing: number;
    netBalance: number;
  }> {
    const response = await this.makeRequest<{
      totalOwed: number;
      totalOwing: number;
      netBalance: number;
    }>('/balances/user/net', {
      cacheTTLMs: options.cacheTTLMs,
    });
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
      invalidatePrefixes: ['/payments', '/balances']
    });
    return response.data;
  }

  static async updatePaymentStatus(paymentId: string, status: 'completed' | 'cancelled'): Promise<PaymentResponse> {
    const response = await this.makeRequest<PaymentResponse>(`/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      invalidatePrefixes: ['/payments', '/balances']
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

  // Khata API
  static async getKhataCustomers(options: {
    search?: string;
    filterType?: 'all' | 'give' | 'get' | 'settled';
    sortType?: 'most-recent' | 'oldest' | 'highest-amount' | 'least-amount' | 'name-az';
    cacheTTLMs?: number;
  } = {}): Promise<Array<{
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    balance: string;
    type: 'give' | 'get' | 'settled';
  }>> {
    const queryParams = new URLSearchParams();
    if (options.search) queryParams.append('search', options.search);
    if (options.filterType) queryParams.append('filterType', options.filterType);
    if (options.sortType) queryParams.append('sortType', options.sortType);

    const response = await this.makeRequest<Array<{
      id: string;
      userId: string;
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      notes?: string;
      createdAt: string;
      updatedAt: string;
      balance: string;
      type: 'give' | 'get' | 'settled';
    }>>(
      `/khata/customers?${queryParams.toString()}`,
      {
        method: 'GET',
        cacheTTLMs: options.cacheTTLMs || 30000,
      }
    );

    return response.data;
  }

  static async getKhataCustomerById(
    customerId: string,
    options?: { cacheTTLMs?: number }
  ): Promise<{
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    balance: string;
    type: 'give' | 'get' | 'settled';
  }> {
    const response = await this.makeRequest<{
      id: string;
      userId: string;
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      notes?: string;
      createdAt: string;
      updatedAt: string;
      balance: string;
      type: 'give' | 'get' | 'settled';
    }>(`/khata/customers/${customerId}`, {
      method: 'GET',
      cacheTTLMs: options?.cacheTTLMs ?? 30000,
    });

    return response.data;
  }

  static async createKhataCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
    notes?: string;
  }): Promise<{
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const response = await this.makeRequest<{
      id: string;
      userId: string;
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      notes?: string;
      createdAt: string;
      updatedAt: string;
    }>(
      '/khata/customers',
      {
        method: 'POST',
        body: JSON.stringify(data),
        invalidatePrefixes: ['/khata'],
      }
    );

    return response.data;
  }

  static async updateKhataCustomer(customerId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
    notes?: string;
  }): Promise<{
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const response = await this.makeRequest<{
      id: string;
      userId: string;
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      avatar?: string;
      notes?: string;
      createdAt: string;
      updatedAt: string;
    }>(
      `/khata/customers/${customerId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
        invalidatePrefixes: ['/khata'],
      }
    );

    return response.data;
  }

  static async deleteKhataCustomer(customerId: string): Promise<void> {
    await this.makeRequest<void>(
      `/khata/customers/${customerId}`,
      {
        method: 'DELETE',
        invalidatePrefixes: ['/khata'],
      }
    );
  }

  static async getKhataCustomerTransactions(
    customerId: string,
    options?: { cacheTTLMs?: number }
  ): Promise<Array<{
    id: string;
    customerId: string;
    userId: string;
    type: 'give' | 'get';
    amount: string;
    currency: string;
    description?: string;
    imageUrl?: string;
    balance: string;
    transactionDate: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const response = await this.makeRequest<Array<{
      id: string;
      customerId: string;
      userId: string;
      type: 'give' | 'get';
      amount: string;
      currency: string;
      description?: string;
      imageUrl?: string;
      balance: string;
      transactionDate: string;
      createdAt: string;
      updatedAt: string;
    }>>(`/khata/customers/${customerId}/transactions`, {
      method: 'GET',
      cacheTTLMs: options?.cacheTTLMs ?? 30000,
    });

    return response.data;
  }

  static async createKhataTransaction(
    data: FormData | {
      customerId: string;
      type: 'give' | 'get';
      amount: string;
      currency?: string;
      description?: string;
      imageUrl?: string;
      transactionDate?: string;
    }
  ): Promise<{
    id: string;
    customerId: string;
    userId: string;
    type: 'give' | 'get';
    amount: string;
    currency: string;
    description?: string;
    imageUrl?: string;
    balance: string;
    transactionDate: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const isFormData = data instanceof FormData;

    console.log('[EvenlyBackendService] createKhataTransaction - isFormData:', isFormData);

    // If FormData, send as multipart/form-data, otherwise send as JSON
    const requestConfig: any = {};

    if (isFormData) {
      // For FormData, we need special handling for React Native
      requestConfig.headers = {
        'Accept': 'application/json',
        // Don't set Content-Type - axios will set it automatically with boundary for FormData
      };
      // Ensure axios treats this as multipart
      requestConfig.transformRequest = [(data: any) => data];

      console.log('[EvenlyBackendService] Sending FormData to /khata/transactions');
    }

    const response = await this.makeRequest<{
      id: string;
      customerId: string;
      userId: string;
      type: 'give' | 'get';
      amount: string;
      currency: string;
      description?: string;
      imageUrl?: string;
      balance: string;
      transactionDate: string;
      createdAt: string;
      updatedAt: string;
    }>(
      '/khata/transactions',
      {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data as {
          customerId: string;
          type: 'give' | 'get';
          amount: string;
          currency?: string;
          description?: string;
          imageUrl?: string;
          transactionDate?: string;
        }),
        ...requestConfig,
        invalidatePrefixes: ['/khata'],
      }
    );

    return response.data;
  }

  static async updateKhataTransaction(
    transactionId: string,
    data: FormData | {
      type?: 'give' | 'get';
      amount?: string;
      currency?: string;
      description?: string;
      imageUrl?: string;
      transactionDate?: string;
    }
  ): Promise<{
    id: string;
    customerId: string;
    userId: string;
    type: 'give' | 'get';
    amount: string;
    currency: string;
    description?: string;
    imageUrl?: string;
    balance: string;
    transactionDate: string;
    createdAt: string;
    updatedAt: string;
  }> {
    const isFormData = data instanceof FormData;

    console.log('[EvenlyBackendService] updateKhataTransaction - isFormData:', isFormData);

    // If FormData, send as multipart/form-data, otherwise send as JSON
    const requestConfig: any = {};

    if (isFormData) {
      // For FormData, we need special handling for React Native
      requestConfig.headers = {
        'Accept': 'application/json',
        // Don't set Content-Type - axios will set it automatically with boundary for FormData
      };
      // Ensure axios treats this as multipart
      requestConfig.transformRequest = [(data: any) => data];

      console.log('[EvenlyBackendService] Sending FormData to /khata/transactions/:id');
    }

    const response = await this.makeRequest<{
      id: string;
      customerId: string;
      userId: string;
      type: 'give' | 'get';
      amount: string;
      currency: string;
      description?: string;
      imageUrl?: string;
      balance: string;
      transactionDate: string;
      createdAt: string;
      updatedAt: string;
    }>(
      `/khata/transactions/${transactionId}`,
      {
        method: 'PUT',
        body: isFormData ? data : JSON.stringify(data),
        ...requestConfig,
        invalidatePrefixes: ['/khata'],
      }
    );

    return response.data;
  }

  static async deleteKhataTransaction(transactionId: string): Promise<void> {
    await this.makeRequest(
      `/khata/transactions/${transactionId}`,
      {
        method: 'DELETE',
        invalidatePrefixes: ['/khata'],
      }
    );
  }

  static async getKhataFinancialSummary(): Promise<{
    totalGive: string;
    totalGet: string;
  }> {
    const response = await this.makeRequest<{
      totalGive: string;
      totalGet: string;
    }>('/khata/summary', {
      method: 'GET',
      cacheTTLMs: 30000,
    });

    return response.data;
  }
}