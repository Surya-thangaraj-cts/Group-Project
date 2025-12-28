
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

type AccountType = 'SAVINGS' | 'CURRENT';
type AccountStatus = 'ACTIVE' | 'CLOSED';
type TxnType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';

interface Account {
  accountId: string;
  customerName: string;
  customerId: string;
  accountType: AccountType;
  balance: number;
  status: AccountStatus;
  openedAt: string; // ISO date
}

interface Transaction {
  id: string;
  time: string; // ISO date
  type: TxnType;
  amount: number;
  accountId: string;
  toAccountId?: string;
  flagged?: boolean;
  narrative?: string;
}

@Component({
  selector: 'officer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './officer.component.html',
  styleUrls: ['./officer.component.css']
})
export class OfficerComponent implements OnInit 
{
  activeTab: 'create' | 'update' | 'history' = 'create';

  // Forms
  createForm: FormGroup;
  updateForm: FormGroup;
  updateFormLoaded = false;

  lookupAccountId = '';

  txnForm: FormGroup;
  selectedHistoryAccountId?: string;

  // Data
  accounts: Account[] = [];
  transactions: Transaction[] = [];

  // High-value threshold (₹)
  highValueThreshold = 100000;

  // Alerts
  alert: { type: 'success' | 'error'; message: string } = { type: 'success', message: '' };

  constructor(private fb: FormBuilder) {
    this.createForm = this.fb.group({
      accountId: ['', [Validators.required, Validators.minLength(3)]],
      customerName: ['', [Validators.required]],
      customerId: ['', [Validators.required]],
      accountType: ['SAVINGS' as AccountType, [Validators.required]],
      balance: [0, [Validators.required, Validators.min(0)]],
      status: ['ACTIVE' as AccountStatus, [Validators.required]],
    });

    this.updateForm = this.fb.group({
      accountId: [{ value: '', disabled: true }, [Validators.required]],
      customerName: ['', [Validators.required]],
      customerId: ['', [Validators.required]],
      accountType: ['SAVINGS' as AccountType, [Validators.required]],
      balance: [0, [Validators.required, Validators.min(0)]],
      status: ['ACTIVE' as AccountStatus, [Validators.required]],
    });

    this.txnForm = this.fb.group({
      type: ['DEPOSIT' as TxnType, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      toAccountId: [undefined],
      narrative: ['']
    });
  }

  ngOnInit(): void {
    this.loadState();
  }

  // ---------- Persistence ----------
  private saveState(): void {
    localStorage.setItem('accounts', JSON.stringify(this.accounts));
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
  }

  private loadState(): void {
    try {
      const a = localStorage.getItem('accounts');
      const t = localStorage.getItem('transactions');
      this.accounts = a ? JSON.parse(a) : [];
      this.transactions = t ? JSON.parse(t) : [];
    } catch {
      this.accounts = [];
      this.transactions = [];
    }
  }

  // ---------- Create ----------
  defaultCreateForm() {
    return {
      accountId: '',
      customerName: '',
      customerId: '',
      accountType: 'SAVINGS',
      balance: 0,
      status: 'ACTIVE',
    };
  }

  createAccount(): void {
    if (this.createForm.invalid) return;

    const value = this.createForm.getRawValue() as Omit<Account, 'openedAt'>;
    const exists = this.accounts.some(a => a.accountId === value.accountId);
    if (exists) {
      return this.setError(`Account ID ${value.accountId} already exists.`);
    }

    const newAcc: Account = {
      ...value,
      openedAt: new Date().toISOString()
    };

    this.accounts.unshift(newAcc);
    this.saveState();
    this.setSuccess(`Account ${newAcc.accountId} created successfully.`);
    this.createForm.reset(this.defaultCreateForm());
  }

  // ---------- Update ----------
  prefillUpdate(accountId?: string): void {
    if (!accountId) {
      return this.setError('Please enter a valid Account ID to load.');
    }
    const acc = this.accounts.find(a => a.accountId === accountId);
    if (!acc) {
      return this.setError(`Account ${accountId} not found.`);
    }
    this.updateForm.setValue({
      accountId: acc.accountId,
      customerName: acc.customerName,
      customerId: acc.customerId,
      accountType: acc.accountType,
      balance: acc.balance,
      status: acc.status,
    });
    this.updateFormLoaded = true;
    this.activeTab = 'update';
  }

  updateAccount(): void {
    if (this.updateForm.invalid) return;
    const value = this.updateForm.getRawValue() as Account;
    const idx = this.accounts.findIndex(a => a.accountId === value.accountId);
    if (idx === -1) return this.setError('Account not found.');

    // Preserve openedAt
    const openedAt = this.accounts[idx].openedAt;
    this.accounts[idx] = { ...value, openedAt };
    this.saveState();
    this.setSuccess(`Account ${value.accountId} updated.`);
    this.updateFormLoaded = false;
    this.lookupAccountId = '';
  }

  // ---------- Transactions ----------
  onTxnTypeChange() {
    // clear toAccountId if not transfer
    if (this.txnForm.value.type !== 'TRANSFER') {
      this.txnForm.patchValue({ toAccountId: undefined });
    }
  }

  resetTxnForm(): void {
    this.txnForm.reset({ type: 'DEPOSIT', amount: 0, toAccountId: undefined, narrative: '' });
  }

  recordTransaction(): void {
    if (!this.selectedHistoryAccountId) {
      return this.setError('Select an account to record transactions.');
    }
    if (this.txnForm.invalid) return;

    const acc = this.accounts.find(a => a.accountId === this.selectedHistoryAccountId);
    if (!acc) return this.setError('Account not found.');
    if (acc.status === 'CLOSED') return this.setError('Cannot record transactions on CLOSED accounts.');

    const { type, amount, toAccountId, narrative } = this.txnForm.getRawValue() as {
      type: TxnType; amount: number; toAccountId?: string; narrative?: string;
    };

    if (type === 'DEPOSIT') {
      acc.balance = round2(acc.balance + amount);
      this.pushTxn({ type, amount, accountId: acc.accountId, narrative });
      this.setSuccess(`Deposited ₹${amount.toFixed(2)} to ${acc.accountId}.`);
    } else if (type === 'WITHDRAWAL') {
      if (acc.balance < amount) {
        return this.setError('Insufficient balance for withdrawal.');
      }
      acc.balance = round2(acc.balance - amount);
      this.pushTxn({ type, amount, accountId: acc.accountId, narrative });
      this.setSuccess(`Withdrew ₹${amount.toFixed(2)} from ${acc.accountId}.`);
    } else if (type === 'TRANSFER') {
      if (!toAccountId) return this.setError('Select a destination account for transfer.');
      if (toAccountId === acc.accountId) return this.setError('Destination account must be different.');
      const dest = this.accounts.find(a => a.accountId === toAccountId);
      if (!dest) return this.setError('Destination account not found.');
      if (dest.status === 'CLOSED') return this.setError('Cannot transfer to a CLOSED destination.');
      if (acc.balance < amount) return this.setError('Insufficient balance for transfer.');

      // Perform transfer
      acc.balance = round2(acc.balance - amount);
      dest.balance = round2(dest.balance + amount);

      // Record two transactions (outgoing & incoming)
      this.pushTxn({ type, amount, accountId: acc.accountId, toAccountId, narrative: narrative || 'Transfer out' });
      this.pushTxn({ type, amount, accountId: dest.accountId, toAccountId: acc.accountId, narrative: 'Transfer in' });

      this.setSuccess(`Transferred ₹${amount.toFixed(2)} from ${acc.accountId} to ${dest.accountId}.`);
    }

    this.saveState();
    this.resetTxnForm();
  }

  private pushTxn(partial: Omit<Transaction, 'id' | 'time' | 'flagged'>): void {
    const flagged = partial.amount >= this.highValueThreshold;
    const txn: Transaction = {
      id: cryptoRandomId(),
      time: new Date().toISOString(),
      flagged,
      ...partial
    };
    this.transactions.unshift(txn);
  }

  flagTransaction(t: Transaction): void {
    t.flagged = true;
    this.saveState();
    this.setSuccess(`Transaction ${t.id} flagged as high value.`);
  }

  transactionsFor(accountId: string): Transaction[] {
    return this.transactions
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  // ---------- Helpers ----------
  goToHistory(accountId: string): void {
    this.selectedHistoryAccountId = accountId;
    this.activeTab = 'history';
  }

  goToCreate(): void {
    this.activeTab = 'create';
  }

  clearAlert(): void {
    this.alert.message = '';
  }

  private setSuccess(message: string): void {
    this.alert = { type: 'success', message };
    setTimeout(() => this.clearAlert(), 3000);
  }

  private setError(message: string): void {
    this.alert = { type: 'error', message };
  }

}

// Utility functions
function cryptoRandomId(): string {
  // Generates a pseudo-random ID; for demo purposes (not cryptographically guaranteed in all browsers)
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


