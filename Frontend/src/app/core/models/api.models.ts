// ============================================
// API Models for Backend Integration
// ============================================

// ========== Common Models ==========
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

// ========== Account Models ==========
export interface Account {
  accountId: string;
  customerName: string;
  customerId: string;
  accountType: number; // 0 = Savings, 1 = Current
  balance: number;
  status: number; // 0 = Active, 1 = Closed, 2 = Pending
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
  accountType: number; // 0 = Savings, 1 = Current, 2 = FixedDeposit
}

export interface UpdateAccountDto {
  customerName: string;
  customerId: string;
  accountType: number;
  status: number;
}

export interface AccountOperationResponse {
  message: string;
  accountId: string; // Backend returns string (e.g., "ACC0001"), not number
  approvalId: number;
  status: string;
}

// ========== Transaction Models ==========
export interface Transaction {
  transactionId: string;
  accountId: string;
  type: string; // 'Deposit' | 'Withdrawal' | 'Transfer'
  amount: number;
  narrative: string;
  date: string;
  status: string; // 'Completed' | 'Pending' | 'Rejected'
  flag: string; // 'Normal' | 'High' | 'Suspicious'
  toAccountId?: string;
}

export interface CreateTransactionDto {
  accountId: string;
  transactionType: number; // 1 = Deposit, 2 = Withdrawal, 3 = Transfer
  amount: number;
  narrative: string;
  toAccountId?: string; // Required for Transfer
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
  approvalId?: number;
  requiresApproval?: boolean;
}

// ========== Approval Models ==========
export interface Approval {
  approvalId: number;
  type: string; // 'AccountCreation' | 'AccountUpdate' | 'HighValueTransaction'
  transactionId?: number;
  accountId?: number;
  reviewerId: number;
  decision: string; // 'Pending' | 'Approve' | 'Reject'
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
  decision: number; // 0 = Pending, 1 = Approve, 2 = Reject
  comments: string;
}

// ========== Notification Models ==========
export interface Notification {
  notificationId: number;
  userId: number;
  type: number; // 0 = ApprovalReminder, 1 = SuspiciousActivity
  message: string;
  status: number; // 0 = Unread, 1 = Read
  createdDate: string;
  approvalId?: number;
  transactionId?: number;
}

export interface UpdateNotificationStatusDto {
  status: number; // 0 = Unread, 1 = Read
}

// ========== Manager Dashboard Models ==========
export interface ManagerDashboard {
  pendingApprovals: number;
  highValuePending: number;
  suspiciousCount: number;
  accountApprovals: number;
  accountUpdateApprovals: number;
  transactionApprovals: number;
  branch: string;
}

export interface ComplianceMetrics {
  totalTransactions: number;
  highValueCount: number;
  accountGrowthRate: number;
  monthlyTxnVolume: number[];
  monthlyLabels: string[];
  monthlySuspicious: number[];
  amountBuckets: AmountBucket[];
}

export interface AmountBucket {
  label: string;
  count: number;
}

// ========== Audit Log Models ==========
export interface AuditLog {
  auditLogId: number;
  userId: number;
  userName: string;
  action: string; // 'Create' | 'Update' | 'Delete' | 'Approve' | 'Reject'
  entityType: string; // 'Account' | 'Transaction' | 'User' | 'Approval'
  entityId: number;
  details: string;
  timestamp: string;
}

// ========== Account Type Models ==========
export interface AccountTypeConfig {
  accountTypeId: number;
  name: string; // 'Savings' | 'Current'
  code: number; // 0 | 1
  description: string;
  defaultTransactionLimit?: number;
  defaultBalanceLimit?: number;
  interestRate?: number;
  minimumBalance?: number;
  isActive: boolean;
}

export interface CreateAccountTypeDto {
  name: string;
  code: number;
  description: string;
  defaultTransactionLimit?: number;
  defaultBalanceLimit?: number;
  interestRate?: number;
  minimumBalance?: number;
}

// ========== Enums ==========
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

export enum TransactionStatus {
  Completed = 'Completed',
  Pending = 'Pending',
  Rejected = 'Rejected'
}

export enum ApprovalDecision {
  Pending = 0,
  Approve = 1,
  Reject = 2
}

export enum NotificationType {
  ApprovalReminder = 0,
  SuspiciousActivity = 1
}

export enum NotificationStatus {
  Unread = 0,
  Read = 1
}
