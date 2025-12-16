#!/usr/bin/env tsx
/**
 * Khata API Test Script
 * 
 * This script tests all Khata API endpoints.
 * Make sure the server is running before executing this script.
 * 
 * Usage:
 *   npm run test:khata
 *   or
 *   tsx scripts/test-khata-api.ts
 */

import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
  status?: number;
}

class KhataAPITester {
  private baseURL: string;
  private authToken: string | null = null;
  private testResults: TestResult[] = [];
  private createdCustomerId: string | null = null;
  private createdTransactionId: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async log(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
    }[type];
    console.log(`${prefix} ${message}`);
  }

  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<{ status: number; data: any }> {
    const url = `${this.baseURL}${endpoint}`;
    const config: any = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { Cookie: `sso_token=${this.authToken}` }),
        ...headers,
      },
    };

    if (data && method !== 'GET') {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return { status: response.status, data: response.data };
    } catch (error: any) {
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data,
        };
      }
      throw error;
    }
  }

  private recordTest(name: string, passed: boolean, error?: string, data?: any, status?: number) {
    this.testResults.push({ name, passed, error, data, status });
    if (passed) {
      this.log(`${name} - PASSED`, 'success');
    } else {
      this.log(`${name} - FAILED: ${error}`, 'error');
    }
  }

  // Step 1: Authenticate and get token
  async authenticate(): Promise<boolean> {
    this.log('Step 1: Authenticating...', 'info');
    try {
      // Try to login or use existing token
      // For now, we'll assume you have a valid token
      // In a real scenario, you'd call the auth endpoint
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      if (response.status === 200 && response.data.data?.accessToken) {
        this.authToken = response.data.data.accessToken;
        this.recordTest('Authentication', true, undefined, undefined, response.status);
        return true;
      } else {
        this.recordTest('Authentication', false, 'Failed to get auth token', response.data, response.status);
        this.log('⚠️  Note: You may need to set a valid auth token manually', 'info');
        this.log('   Set TEST_AUTH_TOKEN environment variable or update the script', 'info');
        return false;
      }
    } catch (error: any) {
      this.recordTest('Authentication', false, error.message);
      return false;
    }
  }

  // Step 2: Test Get Financial Summary
  async testGetFinancialSummary(): Promise<void> {
    this.log('Step 2: Testing GET /api/khata/summary', 'info');
    const result = await this.makeRequest('GET', '/api/khata/summary');
    this.recordTest(
      'Get Financial Summary',
      result.status === 200 && result.data.success,
      result.status !== 200 ? `Status: ${result.status}` : undefined,
      result.data,
      result.status
    );
  }

  // Step 3: Test Get Customers (empty initially)
  async testGetCustomers(): Promise<void> {
    this.log('Step 3: Testing GET /api/khata/customers', 'info');
    const result = await this.makeRequest('GET', '/api/khata/customers');
    this.recordTest(
      'Get Customers',
      result.status === 200 && result.data.success,
      result.status !== 200 ? `Status: ${result.status}` : undefined,
      result.data,
      result.status
    );
  }

  // Step 4: Test Create Customer
  async testCreateCustomer(): Promise<void> {
    this.log('Step 4: Testing POST /api/khata/customers', 'info');
    const customerData = {
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      phone: '+1234567890',
      address: '123 Test Street',
      notes: 'This is a test customer',
    };

    const result = await this.makeRequest('POST', '/api/khata/customers', customerData);
    if (result.status === 201 && result.data.success && result.data.data?.id) {
      this.createdCustomerId = result.data.data.id;
      this.recordTest('Create Customer', true, undefined, result.data, result.status);
    } else {
      this.recordTest('Create Customer', false, `Status: ${result.status}`, result.data, result.status);
    }
  }

  // Step 5: Test Get Customer By ID
  async testGetCustomerById(): Promise<void> {
    if (!this.createdCustomerId) {
      this.recordTest('Get Customer By ID', false, 'No customer ID available');
      return;
    }

    this.log('Step 5: Testing GET /api/khata/customers/:id', 'info');
    const result = await this.makeRequest('GET', `/api/khata/customers/${this.createdCustomerId}`);
    this.recordTest(
      'Get Customer By ID',
      result.status === 200 && result.data.success,
      result.status !== 200 ? `Status: ${result.status}` : undefined,
      result.data,
      result.status
    );
  }

  // Step 6: Test Update Customer
  async testUpdateCustomer(): Promise<void> {
    if (!this.createdCustomerId) {
      this.recordTest('Update Customer', false, 'No customer ID available');
      return;
    }

    this.log('Step 6: Testing PUT /api/khata/customers/:id', 'info');
    const updateData = {
      name: 'Updated Test Customer',
      phone: '+9876543210',
    };

    const result = await this.makeRequest('PUT', `/api/khata/customers/${this.createdCustomerId}`, updateData);
    this.recordTest(
      'Update Customer',
      result.status === 200 && result.data.success,
      result.status !== 200 ? `Status: ${result.status}` : undefined,
      result.data,
      result.status
    );
  }

  // Step 7: Test Create Transaction (You Gave)
  async testCreateTransactionGive(): Promise<void> {
    if (!this.createdCustomerId) {
      this.recordTest('Create Transaction (Give)', false, 'No customer ID available');
      return;
    }

    this.log('Step 7: Testing POST /api/khata/transactions (You Gave)', 'info');
    const transactionData = {
      customerId: this.createdCustomerId,
      type: 'give',
      amount: '1000.00',
      currency: 'INR',
      description: 'Test transaction - You gave money',
    };

    const result = await this.makeRequest('POST', '/api/khata/transactions', transactionData);
    if (result.status === 201 && result.data.success && result.data.data?.id) {
      this.createdTransactionId = result.data.data.id;
      this.recordTest('Create Transaction (Give)', true, undefined, result.data, result.status);
    } else {
      this.recordTest('Create Transaction (Give)', false, `Status: ${result.status}`, result.data, result.status);
    }
  }

  // Step 8: Test Create Transaction (You Got)
  async testCreateTransactionGet(): Promise<void> {
    if (!this.createdCustomerId) {
      this.recordTest('Create Transaction (Get)', false, 'No customer ID available');
      return;
    }

    this.log('Step 8: Testing POST /api/khata/transactions (You Got)', 'info');
    const transactionData = {
      customerId: this.createdCustomerId,
      type: 'get',
      amount: '500.00',
      currency: 'INR',
      description: 'Test transaction - You got money',
    };

    const result = await this.makeRequest('POST', '/api/khata/transactions', transactionData);
    this.recordTest(
      'Create Transaction (Get)',
      result.status === 201 && result.data.success,
      result.status !== 201 ? `Status: ${result.status}` : undefined,
      result.data,
      result.status
    );
  }

  // Step 9: Test Get Customer Transactions
  async testGetCustomerTransactions(): Promise<void> {
    if (!this.createdCustomerId) {
      this.recordTest('Get Customer Transactions', false, 'No customer ID available');
      return;
    }

    this.log('Step 9: Testing GET /api/khata/customers/:id/transactions', 'info');
    const result = await this.makeRequest('GET', `/api/khata/customers/${this.createdCustomerId}/transactions`);
    this.recordTest(
      'Get Customer Transactions',
      result.status === 200 && result.data.success,
      result.status !== 200 ? `Status: ${result.status}` : undefined,
      result.data,
      result.status
    );
  }

  // Step 10: Test Get Customers with Filters
  async testGetCustomersWithFilters(): Promise<void> {
    this.log('Step 10: Testing GET /api/khata/customers with filters', 'info');
    
    // Test with search
    const searchResult = await this.makeRequest('GET', '/api/khata/customers?search=Test');
    this.recordTest(
      'Get Customers (Search)',
      searchResult.status === 200 && searchResult.data.success,
      searchResult.status !== 200 ? `Status: ${searchResult.status}` : undefined,
      searchResult.data,
      searchResult.status
    );

    // Test with filter type
    const filterResult = await this.makeRequest('GET', '/api/khata/customers?filterType=give');
    this.recordTest(
      'Get Customers (Filter)',
      filterResult.status === 200 && filterResult.data.success,
      filterResult.status !== 200 ? `Status: ${filterResult.status}` : undefined,
      filterResult.data,
      filterResult.status
    );

    // Test with sort
    const sortResult = await this.makeRequest('GET', '/api/khata/customers?sortType=name-az');
    this.recordTest(
      'Get Customers (Sort)',
      sortResult.status === 200 && sortResult.data.success,
      sortResult.status !== 200 ? `Status: ${sortResult.status}` : undefined,
      sortResult.data,
      sortResult.status
    );
  }

  // Step 11: Test Get Financial Summary (after transactions)
  async testGetFinancialSummaryAfterTransactions(): Promise<void> {
    this.log('Step 11: Testing GET /api/khata/summary (after transactions)', 'info');
    const result = await this.makeRequest('GET', '/api/khata/summary');
    this.recordTest(
      'Get Financial Summary (After Transactions)',
      result.status === 200 && result.data.success,
      result.status !== 200 ? `Status: ${result.status}` : undefined,
      result.data,
      result.status
    );
  }

  // Step 12: Test Delete Customer (cleanup)
  async testDeleteCustomer(): Promise<void> {
    if (!this.createdCustomerId) {
      this.recordTest('Delete Customer', false, 'No customer ID available');
      return;
    }

    this.log('Step 12: Testing DELETE /api/khata/customers/:id', 'info');
    const result = await this.makeRequest('DELETE', `/api/khata/customers/${this.createdCustomerId}`);
    this.recordTest(
      'Delete Customer',
      result.status === 200 && result.data.success,
      result.status !== 200 ? `Status: ${result.status}` : undefined,
      result.data,
      result.status
    );
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    console.log('\n🚀 Starting Khata API Tests\n');
    console.log(`📍 API Base URL: ${this.baseURL}\n`);

    // Try to authenticate (optional - tests will fail if auth is required)
    await this.authenticate();

    // If we have a token from env, use it
    if (process.env.TEST_AUTH_TOKEN) {
      this.authToken = process.env.TEST_AUTH_TOKEN;
      this.log('Using auth token from TEST_AUTH_TOKEN environment variable', 'info');
    } else {
      // Use default test token
      this.authToken = '3a2ab77166b160254d7908a3ca517243%3A30646c961844d5c1008c51e7d2d9a962bb0181fb7f13cbec1b1c6900342cbe9e';
      this.log('Using default test SSO token', 'info');
    }

    // Run all test steps
    await this.testGetFinancialSummary();
    await this.testGetCustomers();
    await this.testCreateCustomer();
    await this.testGetCustomerById();
    await this.testUpdateCustomer();
    await this.testCreateTransactionGive();
    await this.testCreateTransactionGet();
    await this.testGetCustomerTransactions();
    await this.testGetCustomersWithFilters();
    await this.testGetFinancialSummaryAfterTransactions();
    await this.testDeleteCustomer();

    // Print summary
    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const total = this.testResults.length;
    const passed = this.testResults.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  - ${r.name}`);
          if (r.error) console.log(`    Error: ${r.error}`);
          if (r.status) console.log(`    Status: ${r.status}`);
        });
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  const tester = new KhataAPITester(API_BASE_URL);
  await tester.runAllTests();
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}

export { KhataAPITester };

