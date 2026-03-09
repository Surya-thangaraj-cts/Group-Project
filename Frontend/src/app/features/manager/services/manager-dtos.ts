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

export interface PagedApprovals {
  items: ApprovalDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ApprovalDto {
  approvalId: string;
  type: string;
  accountId: string | null;
  reviewerId: string;
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
  approvalId: string;
  type: string;
  accountId: string | null;
  customerName: string | null;
  customerId: string | null;
  reviewerId: string;
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
  transactionId: string;
  accountId: string;
  type: string;
  amount: number;
  date: string;
  status: number;
  flag: string;
  toAccountId: string | null;
}

export interface AccountDto {
  accountId: string;
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
  notificationId: string;
  userId: string;
  type: number;
  message: string;
  status: number;
  createdDate: string;
  approvalId: string | null;
  transactionId: string | null;
}
