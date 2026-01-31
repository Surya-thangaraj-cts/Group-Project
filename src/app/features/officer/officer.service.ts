import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Account, Transaction, UpdateRequest, TxnType, AlertMsg, Notification, OfficerProfile } from './model';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class OfficerService {
  // State streams
  private accountsSubject = new BehaviorSubject<Account[]>([]);
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  private updateReqsSubject = new BehaviorSubject<UpdateRequest[]>([]);
  private alertSubject = new BehaviorSubject<AlertMsg | null>(null);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);

  accounts$ = this.accountsSubject.asObservable();
  transactions$ = this.transactionsSubject.asObservable();
  updateRequests$ = this.updateReqsSubject.asObservable();
  alert$ = this.alertSubject.asObservable();
  notifications$ = this.notificationsSubject.asObservable();

  // Config
  readonly highValueThreshold = 100000;

  constructor(private auth: AuthService) {
    this.load();
  }

  // ---------- Persistence ----------
  private save(): void {
    localStorage.setItem('accounts', JSON.stringify(this.accountsSubject.value));
    localStorage.setItem('transactions', JSON.stringify(this.transactionsSubject.value));
    localStorage.setItem('updateRequests', JSON.stringify(this.updateReqsSubject.value));
    localStorage.setItem('notifications', JSON.stringify(this.notificationsSubject.value));
  }

  private load(): void {
    try {
      const a = localStorage.getItem('accounts');
      const t = localStorage.getItem('transactions');
      const u = localStorage.getItem('updateRequests');
      const n = localStorage.getItem('notifications');

      // Dummy data to always include
      const dummyAccounts: Account[] = [
        {
          accountId: 'ACC-1001',
          customerName: 'Priya Sharma',
          customerId: 'CUST-001',
          accountType: 'SAVINGS',
          balance: 150000,
          status: 'ACTIVE',
          openedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          accountId: 'ACC-1002',
          customerName: 'Rahul Verma',
          customerId: 'CUST-002',
          accountType: 'CURRENT',
          balance: 500000,
          status: 'ACTIVE',
          openedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          accountId: 'ACC-1003',
          customerName: 'Anita Rao',
          customerId: 'CUST-003',
          accountType: 'SAVINGS',
          balance: 250000,
          status: 'ACTIVE',
          openedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      // Parse existing accounts from localStorage
      const existingAccounts = a ? JSON.parse(a) : [];
      
      // Merge: add dummy accounts that don't already exist by accountId
      const merged = [...dummyAccounts];
      for (const existing of existingAccounts) {
        if (!merged.find(m => m.accountId === existing.accountId)) {
          merged.push(existing);
        }
      }

      this.accountsSubject.next(merged);
      this.transactionsSubject.next(t ? JSON.parse(t) : []);
      this.updateReqsSubject.next(u ? JSON.parse(u) : []);
      this.notificationsSubject.next(n ? JSON.parse(n) : []);
    } catch {
      // Fallback dummy data on error
      const dummyAccounts: Account[] = [
        {
          accountId: 'ACC-1001',
          customerName: 'Priya Sharma',
          customerId: 'CUST-001',
          accountType: 'SAVINGS',
          balance: 150000,
          status: 'ACTIVE',
          openedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          accountId: 'ACC-1002',
          customerName: 'Rahul Verma',
          customerId: 'CUST-002',
          accountType: 'CURRENT',
          balance: 500000,
          status: 'ACTIVE',
          openedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          accountId: 'ACC-1003',
          customerName: 'Anita Rao',
          customerId: 'CUST-003',
          accountType: 'SAVINGS',
          balance: 250000,
          status: 'ACTIVE',
          openedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      this.accountsSubject.next(dummyAccounts);
      this.transactionsSubject.next([]);
      this.updateReqsSubject.next([]);
      this.notificationsSubject.next([]);
    }
  }

  // ---------- Alerts (banner) ----------
  clearAlert() { this.alertSubject.next(null); }
  setSuccess(message: string) { this.alertSubject.next({ type: 'success', message }); }
  setError(message: string) { this.alertSubject.next({ type: 'error', message }); }

  // ---------- Accounts ----------
  getAccountById(accountId: string): Account | undefined {
    return this.accountsSubject.value.find(a => a.accountId === accountId);
  }

  createAccount(input: Omit<Account, 'openedAt'>): void {
    const accounts = [...this.accountsSubject.value];
    const exists = accounts.some(a => a.accountId === input.accountId);
    if (exists) throw new Error(`Account ID ${input.accountId} already exists.`);

    const newAcc: Account = { ...input, openedAt: new Date().toISOString() };
    accounts.unshift(newAcc);
    this.accountsSubject.next(accounts);
    this.save();
    this.setSuccess(`Account ${newAcc.accountId} created successfully.`);
  }

  // ---------- Update Requests ----------
  submitUpdateRequest(newValues: Account): void {
    const accounts = this.accountsSubject.value;
    const existing = accounts.find(a => a.accountId === newValues.accountId);
    if (!existing) throw new Error('Account not found.');

    // Build change summary
    const changes: string[] = [];
    if (existing.customerName !== newValues.customerName)
      changes.push(`Customer Name: "${existing.customerName}" → "${newValues.customerName}"`);
    if (existing.customerId !== newValues.customerId)
      changes.push(`Customer ID: "${existing.customerId}" → "${newValues.customerId}"`);
    if (existing.accountType !== newValues.accountType)
      changes.push(`Account Type: ${existing.accountType} → ${newValues.accountType}`);
    if (existing.balance !== newValues.balance)
      changes.push(`Balance: ₹${existing.balance} → ₹${newValues.balance}`);
    if (existing.status !== newValues.status)
      changes.push(`Status: ${existing.status} → ${newValues.status}`);

    const req: UpdateRequest = {
      updateId: cryptoRandomId(),
      accountId: newValues.accountId,
      customerName: newValues.customerName,
      customerId: newValues.customerId,
      accountType: newValues.accountType,
      changeSummary: changes.length ? changes.join(' | ') : 'No changes detected',
      status: 'PENDING',
      time: new Date().toISOString()
    };

    const updateReqs = [req, ...this.updateReqsSubject.value];
    this.updateReqsSubject.next(updateReqs);

    // NEW: Add notification for update request
    this.addNotification({
      type: 'UPDATE_REQUEST',
      title: `Update request for ${req.accountId}`,
      message: req.changeSummary,
      meta: { accountId: req.accountId, updateId: req.updateId }
    });

    this.save();
    this.setSuccess(`Update request created for Account ${newValues.accountId}.`);
  }

  // ---------- Transactions ----------
  recordTransaction(
    sourceAccountId: string,
    form: { type: TxnType; amount: number; toAccountId?: string; narrative?: string }
  ): void {
    const { type, amount, toAccountId, narrative } = form;
    if (!sourceAccountId) throw new Error('Select an account to record transactions.');

    const accounts = [...this.accountsSubject.value];
    const source = accounts.find(a => a.accountId === sourceAccountId);
    if (!source) throw new Error('Account not found.');
    if (source.status === 'CLOSED') throw new Error('Cannot record transactions on CLOSED accounts.');
    if (amount <= 0) throw new Error('Amount must be greater than zero.');

    const txns = [...this.transactionsSubject.value];
    const isHigh = amount >= this.highValueThreshold;

    if (type === 'DEPOSIT') {
      source.balance = round2(source.balance + amount);
      const tx = this.makeTxn({ type, amount, accountId: source.accountId, narrative });
      txns.unshift(tx);
      if (isHigh) {
        this.addNotification({
          type: 'HIGH_VALUE_TXN',
          title: `High-value DEPOSIT on ${source.accountId}`,
          message: `₹${amount.toFixed(2)} deposited.`,
          meta: { accountId: source.accountId, txnId: tx.id, amount }
        });
      }
      this.setSuccess(`Deposited ₹${amount.toFixed(2)} to ${source.accountId}.`);
    } else if (type === 'WITHDRAWAL') {
      if (source.balance < amount) throw new Error('Insufficient balance for withdrawal.');
      source.balance = round2(source.balance - amount);
      const tx = this.makeTxn({ type, amount, accountId: source.accountId, narrative });
      txns.unshift(tx);
      if (isHigh) {
        this.addNotification({
          type: 'HIGH_VALUE_TXN',
          title: `High-value WITHDRAWAL on ${source.accountId}`,
          message: `₹${amount.toFixed(2)} withdrawn.`,
          meta: { accountId: source.accountId, txnId: tx.id, amount }
        });
      }
      this.setSuccess(`Withdrew ₹${amount.toFixed(2)} from ${source.accountId}.`);
    } else {
      if (!toAccountId) throw new Error('Select a destination account for transfer.');
      if (toAccountId === source.accountId) throw new Error('Destination account must be different.');
      const dest = accounts.find(a => a.accountId === toAccountId);
      if (!dest) throw new Error('Destination account not found.');
      if (dest.status === 'CLOSED') throw new Error('Cannot transfer to a CLOSED destination.');
      if (source.balance < amount) throw new Error('Insufficient balance for transfer.');

      // Perform transfer
      source.balance = round2(source.balance - amount);
      dest.balance = round2(dest.balance + amount);

      // Record two transactions (outgoing & incoming)
      const txOut = this.makeTxn({
        type, amount, accountId: source.accountId, toAccountId, narrative: narrative || 'Transfer out'
      });
      const txIn = this.makeTxn({
        type, amount, accountId: dest.accountId, toAccountId: source.accountId, narrative: 'Transfer in'
      });
      txns.unshift(txOut);
      txns.unshift(txIn);

      if (isHigh) {
        this.addNotification({
          type: 'HIGH_VALUE_TXN',
          title: `High-value TRANSFER from ${source.accountId}`,
          message: `₹${amount.toFixed(2)} → ${dest.accountId}`,
          meta: { accountId: source.accountId, toAccountId: dest.accountId, txnId: txOut.id, amount }
        });
      }

      this.setSuccess(`Transferred ₹${amount.toFixed(2)} from ${source.accountId} to ${dest.accountId}.`);
    }

    // Commit
    this.accountsSubject.next(accounts);
    this.transactionsSubject.next(txns);
    this.save();
  }

  // ---------- Notifications (helpers) ----------
  private addNotification(input: Omit<Notification, 'id' | 'time' | 'read'>): void {
    const n: Notification = {
      id: cryptoRandomId(),
      time: new Date().toISOString(),
      read: false,
      ...input
    };
    const list = [n, ...this.notificationsSubject.value];
    this.notificationsSubject.next(list);
    this.save();
  }

  markAsRead(id: string): void {
    const list = this.notificationsSubject.value.map(n => n.id === id ? { ...n, read: true } : n);
    this.notificationsSubject.next(list);
    this.save();
  }

  markAsUnread(id: string): void {
    const list = this.notificationsSubject.value.map(n => n.id === id ? { ...n, read: false } : n);
    this.notificationsSubject.next(list);
    this.save();
  }

  deleteNotification(id: string): void {
    const list = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(list);
    this.save();
  }

  markAllAsRead(): void {
    const list = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(list);
    this.save();
  }

  clearAllNotifications(): void {
    this.notificationsSubject.next([]);
    this.save();
  }

  // helper
  private makeTxn(partial: Omit<Transaction, 'id' | 'time' | 'flagged'>): Transaction {
    const flagged = partial.amount >= this.highValueThreshold;
    return {
      id: cryptoRandomId(),
      time: new Date().toISOString(),
      flagged,
      ...partial
    };
  }

  // ---------- Officer Profile ----------
  getOfficerProfile(): Observable<OfficerProfile> {
    // Prefer authenticated user data; fallback to a minimal empty profile
    const user = this.auth.getCurrentUser();
    if (user) {
      const parts = (user.name || '').trim().split(/\s+/);
      const firstName = parts.length ? parts[0] : '';
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
      const profile: OfficerProfile = {
        id: user.userId ? `OFF-${user.userId}` : 'OFF-UNKNOWN',
        firstName,
        lastName,
        email: user.email || '',
        phone: '',
        designation: user.role === 'bankOfficer' ? 'Banking Officer' : (user.role || ''),
        role: user.role || '',
        status: user.status || '',
        employeeId: user.userId || '',
        joinDate: '',
        department: user.branch || '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
      };
      return of(profile);
    }

    // No authenticated user found; return a safe empty profile rather than a hardcoded demo
    const empty: OfficerProfile = {
      id: 'OFF-UNKNOWN',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      designation: '',
      role: '',
      status: '',
      employeeId: '',
      joinDate: '',
      department: '',
      address: '',
      city: '',
      state: '',
      zipCode: ''
    };
    return of(empty);
  }
}

// Utilities
function cryptoRandomId(): string {
  try {
    const buf = new Uint8Array(8);
    (window.crypto || (window as any).msCrypto).getRandomValues(buf);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
