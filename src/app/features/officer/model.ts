
// src/app/features/officer/model.ts
export type AccountType = 'SAVINGS' | 'CURRENT';
export type AccountStatus = 'ACTIVE' | 'CLOSED';
export type TxnType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';

export interface Account {
  accountId: string;
  customerName: string;
  customerId: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  openedAt: string; // ISO
}

export interface Transaction {
  id: string;
  time: string; // ISO
  type: TxnType;
  amount: number;
  accountId: string;
  toAccountId?: string;
  flagged?: boolean;
  narrative?: string;
}

export interface UpdateRequest {
  updateId: string;
  accountId: string;
  customerName: string;
  customerId: string;
  accountType: AccountType;
  changeSummary: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  time: string;
}

export interface AlertMsg {
  type: 'success' | 'error';
  message: string;
}

// ===== NEW: Notifications for Alerts tab =====
export type NotificationType = 'UPDATE_REQUEST' | 'HIGH_VALUE_TXN' | 'TXN_FLAGGED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string; // ISO
  read: boolean;
  meta?: {
    accountId?: string;
    updateId?: string;
    txnId?: string;
    amount?: number;
    toAccountId?: string;
  };
}
