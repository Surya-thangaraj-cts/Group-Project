
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
  status: 'PENDING'; // future: 'APPROVED' | 'REJECTED'
  time: string;
}

export interface AlertMsg {
  type: 'success' | 'error';
  message: string;
}