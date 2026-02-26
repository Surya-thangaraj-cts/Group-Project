// Dashboard overview DTO for manager dashboard
export interface ManagerDashboardOverviewDto {
  totalTransactions: number;
  highValueCount: number;
  pendingApprovalsCount: number;
  totalAccounts: number;
  activeAccounts: number;
  pendingAccounts: number;
  accountGrowthRate: number;
  monthlyLabels: string[];
  monthlyTxnVolume: number[];
  monthlySuspicious: number[];
  monthlyNewAccounts: number[];
  monthlyActiveAccounts: number[];
  amountBuckets: AmountBucketDto[];
}
// DTO interfaces for ManagerService

export interface PagedApprovals {
  items: ApprovalDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ApprovalDto {
  approvalId: number;
  type: string;
  accountId: number | null;
  reviewerId: number;
  decision: string;
  pendingChanges: string;
  approvalDate: string;
  comments: string;
}

export interface PagedApprovalDetails {
  items: ApprovalDetailsDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ApprovalDetailsDto {
  approvalId: number;
  type: string;
  accountId: number | null;
  customerName: string | null;
  reviewerId: number;
  decision: string;
  pendingChanges: string;
  approvalDate: string;
  comments: string;
}

export interface PagedTransactions {
  items: TransactionDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface TransactionDto {
  transactionId: number;
  accountId: number;
  type: string;
  amount: number;
  date: string;
  status: number;
  flag: string;
  toAccountId: number | null;
}

export interface AccountDto {
  accountId: number;
  customerName: string;
  customerId: string;
  accountType: number;
  balance: number;
  status: number;
}

export interface ComplianceMetricsDto {
  totalTransactions: number;
  highValueCount: number;
  accountGrowthRate: number;
  monthlyTxnVolume: number[];
  monthlyLabels: string[];
  monthlySuspicious: number[];
  amountBuckets: AmountBucketDto[];
}

export interface AmountBucketDto {
  label: string;
  count: number;
}

export interface NotificationDto {
  notificationId: number;
  userId: number;
  type: number;
  message: string;
  status: number;
  createdDate: string;
  approvalId: number | null;
  transactionId: number | null;
}
