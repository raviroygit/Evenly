import { Expense, Group, User } from '../types';
import { GROUP_COLORS } from '../constants';

// Mock User Data
export const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'JD',
  stats: {
    groups: 12,
    totalSpent: 2450,
    owed: 1200,
  },
};

// Mock Expenses Data
export const mockExpenses: Expense[] = [
  { 
    id: '1', 
    title: 'Grocery Shopping', 
    amount: 85.50, 
    category: 'Food', 
    date: 'Today', 
    type: 'expense',
    description: 'Weekly grocery shopping at Whole Foods'
  },
  { 
    id: '2', 
    title: 'Gas Station', 
    amount: 45.00, 
    category: 'Transport', 
    date: 'Yesterday', 
    type: 'expense',
    description: 'Fuel for the week'
  },
  { 
    id: '3', 
    title: 'Freelance Work', 
    amount: 500.00, 
    category: 'Income', 
    date: '2 days ago', 
    type: 'income',
    description: 'Web development project'
  },
  { 
    id: '4', 
    title: 'Coffee Shop', 
    amount: 4.50, 
    category: 'Food', 
    date: '3 days ago', 
    type: 'expense',
    description: 'Morning coffee'
  },
  { 
    id: '5', 
    title: 'Netflix Subscription', 
    amount: 15.99, 
    category: 'Entertainment', 
    date: '1 week ago', 
    type: 'expense',
    description: 'Monthly subscription'
  },
  { 
    id: '6', 
    title: 'Gym Membership', 
    amount: 29.99, 
    category: 'Health', 
    date: '1 week ago', 
    type: 'expense',
    description: 'Monthly gym membership'
  },
  { 
    id: '7', 
    title: 'Salary', 
    amount: 3000.00, 
    category: 'Income', 
    date: '2 weeks ago', 
    type: 'income',
    description: 'Monthly salary'
  },
];

// Mock Groups Data
export const mockGroups: Group[] = [
  { 
    id: '1', 
    name: 'Roommates', 
    members: 4, 
    totalExpenses: 1250.75, 
    lastActivity: '2 hours ago', 
    color: GROUP_COLORS[0],
    description: 'Shared apartment expenses'
  },
  { 
    id: '2', 
    name: 'Vacation Trip', 
    members: 6, 
    totalExpenses: 3200.50, 
    lastActivity: '1 day ago', 
    color: GROUP_COLORS[1],
    description: 'Summer vacation to Europe'
  },
  { 
    id: '3', 
    name: 'Office Lunch', 
    members: 8, 
    totalExpenses: 450.25, 
    lastActivity: '3 days ago', 
    color: GROUP_COLORS[2],
    description: 'Team lunch expenses'
  },
  { 
    id: '4', 
    name: 'Gym Buddies', 
    members: 3, 
    totalExpenses: 180.00, 
    lastActivity: '1 week ago', 
    color: GROUP_COLORS[3],
    description: 'Shared gym and fitness expenses'
  },
  { 
    id: '5', 
    name: 'Book Club', 
    members: 5, 
    totalExpenses: 75.50, 
    lastActivity: '2 weeks ago', 
    color: GROUP_COLORS[4],
    description: 'Monthly book purchases and coffee'
  },
];

// Mock Recent Activity Data
export const mockRecentActivity = [
  { id: '1', title: 'Coffee Shop', amount: -4.50, type: 'expense' },
  { id: '2', title: 'Salary', amount: 3000.00, type: 'income' },
  { id: '3', title: 'Grocery Shopping', amount: -85.50, type: 'expense' },
  { id: '4', title: 'Gas Station', amount: -45.00, type: 'expense' },
  { id: '5', title: 'Freelance Work', amount: 500.00, type: 'income' },
];
