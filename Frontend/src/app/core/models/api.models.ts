export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

export interface Account {
  accountId: string;
  customerName: string;
  customerId: string;
  accountType: number;
  balance: number;
  status: number;
  transactionLimit?: number;
  balanceLimit?: number;
}

export interface AccountDto {
  accountId: string;
  customerName: string;
  customerId: string;
  accountType: number;
  balance: number;
  status: number;
  transactionLimit?: number;
  balanceLimit?: number;
}

export interface CreateAccountDto {
  accountId: string;
  customerName: string;
  customerId: string;
  accountType: number;
}

export interface UpdateAccountDto {
  customerName: string;
  customerId: string;
  accountType: number;
  status: number;
}

export interface AccountOperationResponse {
  message: string;
  accountId: string;
  approvalId: string;
  status: string;
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  type: string;
  amount: number;
  narrative: string;
  date: string;
  status: string;
  flag: string;
  toAccountId?: string;
}

export interface CreateTransactionDto {
  accountId: string;
  transactionType: number;
  amount: number;
  narrative: string;
  toAccountId?: string;
}

export interface TransactionDto {
  transactionId: string;
  accountId: string;
  type: string;
  amount: number;
  narrative: string;
  date: string;
  status: string;
  flag: string;
  toAccountId?: string;
}

export interface TransactionCreationResponse extends TransactionDto {
  approvalId?: string;
  requiresApproval?: boolean;
}

export interface Approval {
  approvalId: string;
  type: string;
  transactionId?: string;
  accountId?: string;
  reviewerId: string;
  decision: string;
  comments: string;
  approvalDate: string;
  pendingChanges?: string;
}

export interface ApprovalDetailsDto extends Approval {
  transactionAmount?: number;
  transactionType?: string;
  accountCustomerName?: string;
}

export interface UpdateApprovalDto {
  decision: number;
  comments: string;
}

export enum AccountType {
  Savings = 0,
  Current = 1
}

export enum AccountStatus {
  Active = 0,
  Closed = 1,
  Pending = 2
}

export enum TransactionType {
  Deposit = 1,
  Withdrawal = 2,
  Transfer = 3
}
