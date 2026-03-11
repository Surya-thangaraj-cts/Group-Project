// Dashboard overview data for manager
export interface ManagerDashboardOverviewDto {
  totalTransactions: number;      // Total number of transactions
  highValueCount: number;         // Number of high-value transactions
  pendingApprovalsCount: number;  // Number of pending approvals
  totalAccounts: number;          // Total accounts
  activeAccounts: number;         // Active accounts
  pendingAccounts: number;        // Pending accounts
  accountGrowthRate: number;      // Account growth rate
  monthlyLabels: string[];        // Labels for monthly data
  monthlyTxnVolume: number[];     // Monthly transaction volume
  monthlySuspicious: number[];    // Monthly suspicious transactions
  monthlyNewAccounts: number[];   // Monthly new accounts
  monthlyActiveAccounts: number[];// Monthly active accounts
  amountBuckets: AmountBucketDto[];// Amount bucket breakdown
}

// Paginated approvals result
export interface PagedApprovals {
  items: ApprovalDto[];           // List of approvals
  pageNumber: number;             // Current page number
  pageSize: number;               // Items per page
  totalCount: number;             // Total approvals
  totalPages: number;             // Total pages
}

// Single approval record
export interface ApprovalDto {
  approvalId: string;             // Approval ID
  type: string;                   // Approval type
  accountId: string | null;       // Related account ID
  reviewerId: string;             // Reviewer ID
  decision: string;               // Decision status
  pendingChanges: string;         // Pending changes
  approvalDate: string;           // Date of approval
  comments: string;               // Comments
}

// Paginated approval details
export interface PagedApprovalDetails {
  items: ApprovalDetailsDto[];    // List of approval details
  pageNumber: number;             // Current page number
  pageSize: number;               // Items per page
  totalCount: number;             // Total approval details
  totalPages: number;             // Total pages
}

// Detailed approval record
export interface ApprovalDetailsDto {
  approvalId: string;             // Approval ID
  type: string;                   // Approval type
  accountId: string | null;       // Related account ID
  customerName: string | null;    // Customer name
  customerId: string | null;      // Customer ID
  reviewerId: string;             // Reviewer ID
  decision: string;               // Decision status
  pendingChanges: string;         // Pending changes
  approvalDate: string;           // Date of approval
  comments: string;               // Comments
}

// Paginated transactions result
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
