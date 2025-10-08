import { CommonSchemas } from './commonSchemas';
import { GroupSchemas } from './groupSchemas';
import { ExpenseSchemas } from './expenseSchemas';
import { BalanceSchemas } from './balanceSchemas';
import { PaymentSchemas } from './paymentSchemas';

export const Schemas = {
  ...CommonSchemas,
  ...GroupSchemas,
  ...ExpenseSchemas,
  ...BalanceSchemas,
  ...PaymentSchemas,
};

export * from './commonSchemas';
export * from './groupSchemas';
export * from './expenseSchemas';
export * from './balanceSchemas';
export * from './paymentSchemas';
