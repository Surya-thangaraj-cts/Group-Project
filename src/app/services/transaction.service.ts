import { Injectable } from '@angular/core';

export interface Transaction {
  transactionId: string;
  accountId: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer';
  amount: number;
  date: string; // ISO string
  status: 'Completed' | 'Pending' | 'Failed';
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private storageKey = 'transactions';

  constructor() {
    this.ensureSeedData();
  }

  private ensureSeedData() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      const now = new Date();
      const seed: Transaction[] = [
        { transactionId: 'TXN1001', accountId: 'ACCT2001', type: 'Deposit', amount: 1500.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 20).toISOString(), status: 'Completed' },
        { transactionId: 'TXN1002', accountId: 'ACCT2002', type: 'Withdrawal', amount: 200.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(), status: 'Completed' },
        { transactionId: 'TXN1003', accountId: 'ACCT2003', type: 'Transfer', amount: 5000.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(), status: 'Pending' },
        { transactionId: 'TXN1004', accountId: 'ACCT2001', type: 'Deposit', amount: 320.50, date: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), status: 'Completed' },
        { transactionId: 'TXN1005', accountId: 'ACCT2004', type: 'Withdrawal', amount: 125.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(), status: 'Failed' },
        { transactionId: 'TXN1006', accountId: 'ACCT2005', type: 'Deposit', amount: 980.75, date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(), status: 'Completed' },
        { transactionId: 'TXN1007', accountId: 'ACCT2006', type: 'Transfer', amount: 25000.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1).toISOString(), status: 'Pending' },
        { transactionId: 'TXN1008', accountId: 'ACCT2002', type: 'Deposit', amount: 45.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(), status: 'Completed' },
        { transactionId: 'TXN1009', accountId: 'ACCT2007', type: 'Withdrawal', amount: 600.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(), status: 'Failed' },
        { transactionId: 'TXN1010', accountId: 'ACCT2008', type: 'Transfer', amount: 750.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 36).toISOString(), status: 'Completed' },
        { transactionId: 'TXN1011', accountId: 'ACCT2001', type: 'Deposit', amount: 150.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString(), status: 'Completed' },
        { transactionId: 'TXN1012', accountId: 'ACCT2009', type: 'Withdrawal', amount: 40.00, date: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(), status: 'Pending' }
      ];
      localStorage.setItem(this.storageKey, JSON.stringify(seed));
    }
  }

  getAll(): Transaction[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) as Transaction[] : [];
  }

  add(tx: Transaction) {
    const arr = this.getAll();
    arr.unshift(tx);
    localStorage.setItem(this.storageKey, JSON.stringify(arr));
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }
}
