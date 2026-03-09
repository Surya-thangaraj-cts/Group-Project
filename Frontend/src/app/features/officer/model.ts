export type AccountType = 'SAVINGS' | 'CURRENT' | 'FIXED_DEPOSIT';
export type AccountStatus = 'ACTIVE' | 'CLOSED' | 'PENDING';
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
  status?: 'Completed' | 'Pending' | 'Rejected' | number; // Allow both string and numeric status
  flag?: 'Normal' | 'High' | 'Suspicious';
}
 
export interface UpdateRequest {
  updateId: string;
  accountId: string;
  customerName: string;
  customerId: string;
  accountType: AccountType;
  changeSummary: string;
  requestType: 'AccountCreation' | 'AccountUpdate';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  time: string;
}
 
export interface AlertMsg {
  type: 'success' | 'error';
  message: string;
}
 
export type NotificationType = 'UPDATE_REQUEST' | 'TRANSACTION' | 'TXN_FLAGGED' | 'ACCOUNT_CREATION';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  time?: string;
  timestamp?: string;
  read: boolean;
  severity?: 'info' | 'warning' | 'error' | 'success';
  meta?: {
    accountId?: string | number;
    updateId?: string | number;
    txnId?: string | number;
    amount?: number;
    toAccountId?: string;
    customerName?: string;
    customerId?: string;
    accountType?: string;
    changes?: string[];
    type?: string;
    approvalId?: string;
    status?: string;
    decision?: string;
    comments?: string;
    narrative?: string;
  };
}

export interface OfficerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  role: string;
  status: string;
  employeeId: string;
  joinDate: string;
  department?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}
