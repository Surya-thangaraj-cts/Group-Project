 
 
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OfficerService } from '../officer.service';
import { TxnType, Transaction } from '../model';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['../officer-theme.css'],
})
export class TransactionsComponent {
  private fb = inject(FormBuilder);
  private officerSvc = inject(OfficerService);

  accounts$ = this.officerSvc.accounts$;
  activeAccounts$ = this.officerSvc.accounts$.pipe(
    map(accounts => (accounts || []).filter(a => a.status === 'ACTIVE'))
  );
  transactions$ = this.officerSvc.transactions$;

  txnForm: FormGroup = this.fb.group({
    type: ['DEPOSIT' as TxnType, [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    toAccountId: [undefined],
    narrative: ['']
  });

  highValueThreshold = this.officerSvc.highValueThreshold;
  toAccountStatus: 'internal' | 'external' | null = null;
  filteredToAccounts: any[] = [];
  showToSuggestions = false;

  // Record Transaction - Account selection with autocomplete
  recordTxnAccountInput = '';
  filteredRecordTxnAccounts: any[] = [];
  showRecordTxnSuggestions = false;

  // Balance checking properties with autocomplete
  balanceCheckAccountInput = '';
  filteredBalanceAccounts: any[] = [];
  showBalanceSuggestions = false;
  selectedBalanceAccount: any = null;
  balanceLoading = false;

  historyFilterAccountId?: string;
  fromDate?: string;
  toDate?: string;

  private filterAccountId$ = new BehaviorSubject<string | undefined>(undefined);
  private fromDate$ = new BehaviorSubject<string | undefined>(undefined);
  private toDate$ = new BehaviorSubject<string | undefined>(undefined);

  onFilterAccountChange(val: string | undefined) {
    this.historyFilterAccountId = val || undefined;
    this.filterAccountId$.next(this.historyFilterAccountId);
    this.txPageIndex$.next(1);
  }

  onFromDateChange(val: string | undefined) {
    this.fromDate = val || undefined;
    this.fromDate$.next(this.fromDate);
    this.txPageIndex$.next(1);
  }

  onToDateChange(val: string | undefined) {
    this.toDate = val || undefined;
    this.toDate$.next(this.toDate);
    this.txPageIndex$.next(1);
  }

  /**
   * Format transaction status from numeric or string value to readable text
   * 0 or 'Completed' = Completed
   * 1 or 'Pending' = Pending
   * 2 or 'Rejected' = Rejected
   */
  formatTransactionStatus(status: string | number | null | undefined): string {
    if (!status) return 'Completed';
    
    // If it's already a string, return as-is (already formatted)
    if (typeof status === 'string') return status;
    
    // Convert numeric status to text
    switch (status) {
      case 0:
        return 'Completed';
      case 1:
        return 'Pending';
      case 2:
        return 'Rejected';
      default:
        return 'Completed';
    }
  }

  txPageSizeOptions = [5, 10, 20];
  private txPageIndex$ = new BehaviorSubject<number>(1);
  private txPageSize$ = new BehaviorSubject<number>(10);

  txVm$: Observable<{
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    pageData: Transaction[];
    from: number;
    to: number;
    pages: number[];
  }> = combineLatest([
    this.transactions$,
    this.filterAccountId$,
    this.fromDate$,
    this.toDate$,
    this.txPageIndex$,
    this.txPageSize$
  ]).pipe(
    map(([all, accountId, from, to, pageIndex, pageSize]) => {
      const list: Transaction[] = Array.isArray(all) ? [...all] : [];

      const filtered = list.filter(t => {
        // Include all transactions (both pending and completed)
        if (accountId && t.accountId !== accountId) return false;

        const txDate = new Date(t.time).setHours(0, 0, 0, 0);
        if (from) {
          const f = new Date(from).setHours(0, 0, 0, 0);
          if (txDate < f) return false;
        }
        if (to) {
          const tt = new Date(to).setHours(23, 59, 59, 999);
          if (txDate > tt) return false;
        }
        return true;
      });

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const currentPage = Math.min(Math.max(1, pageIndex), totalPages);
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const pageData = filtered.slice(start, end);
      const fromIdx = total ? start + 1 : 0;
      const toIdx = Math.min(end, total);
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

      return { total, totalPages, currentPage, pageSize, pageData, from: fromIdx, to: toIdx, pages };
    })
  );

  txSetPage(page: number): void {
    this.txPageIndex$.next(page);
  }

  txPrevPage(): void {
    this.txPageIndex$.next(Math.max(1, this.txPageIndex$.getValue() - 1));
  }

  txNextPage(): void {
    this.txPageIndex$.next(this.txPageIndex$.getValue() + 1);
  }

  onTxPageSizeChange(ev: Event): void {
    const size = Number((ev.target as HTMLSelectElement).value) || 10;
    this.txPageSize$.next(size);
    this.txPageIndex$.next(1);
  }

  onTxnTypeChange() {
    if (this.txnForm.value.type !== 'TRANSFER') {
      this.txnForm.patchValue({ toAccountId: undefined });
      this.toAccountStatus = null;
    }
  }

  onToAccountIdInput(): void {
    const toId = (this.txnForm.value.toAccountId || '').trim();
    if (!toId) {
      this.toAccountStatus = null;
      this.filteredToAccounts = [];
      this.showToSuggestions = false;
      return;
    }
    const accounts = (this.officerSvc as any).accountsSubject?.value || [];
    const active = accounts.filter((a: any) => a.status === 'ACTIVE');
    const query = toId.toUpperCase();
    this.filteredToAccounts = active.filter((a: any) =>
      a.accountId !== this.recordTxnAccountInput.trim() &&
      (a.accountId.toUpperCase().includes(query) || a.customerName.toUpperCase().includes(query))
    );
    this.showToSuggestions = this.filteredToAccounts.length > 0;

    const found = active.find((a: any) => a.accountId === toId);
    this.toAccountStatus = found ? 'internal' : 'external';
  }

  selectToAccount(accountId: string): void {
    this.txnForm.patchValue({ toAccountId: accountId });
    this.showToSuggestions = false;
    this.toAccountStatus = 'internal';
  }

  hideToSuggestions(): void {
    setTimeout(() => { this.showToSuggestions = false; }, 200);
  }

  resetTxnForm(): void {
    this.txnForm.reset({ type: 'DEPOSIT', amount: 0, toAccountId: undefined, narrative: '' });
    this.recordTxnAccountInput = '';
    this.filteredRecordTxnAccounts = [];
    this.showRecordTxnSuggestions = false;
  }

  recordTransaction(): void {
    const formVal = this.txnForm.getRawValue();
    if (formVal.type === 'TRANSFER') {
      const toId = (formVal.toAccountId || '').trim();
      if (!toId) {
        this.officerSvc.setError('Please enter a destination Account ID for the transfer.');
        return;
      }
      if (toId === this.recordTxnAccountInput.trim()) {
        this.officerSvc.setError('Cannot transfer to the same account.');
        return;
      }
      formVal.toAccountId = toId;
    }
    try {
      this.officerSvc.recordTransaction(
        this.recordTxnAccountInput.trim()!,
        formVal
      );
      this.resetTxnForm();
      this.toAccountStatus = null;
    } catch (e: any) {
      this.officerSvc.setError(e?.message || 'Failed to record transaction');
    }
  }

  trackByTxnId(index: number, t: Transaction) {
    return t?.id ?? index;
  }

  /**
   * Check balance for the selected account
   */
  checkBalance(): void {
    const accountId = this.balanceCheckAccountInput.trim();
    
    if (!accountId) {
      this.officerSvc.setError('Please select an account to check balance');
      return;
    }

    this.balanceLoading = true;
    const accounts = (this.officerSvc as any).accountsSubject?.value || [];
    const account = accounts.find((a: any) => a.accountId === accountId);
    
    if (account) {
      this.selectedBalanceAccount = account;
      this.balanceLoading = false;
    } else {
      this.officerSvc.setError('Account not found');
      this.balanceLoading = false;
      this.selectedBalanceAccount = null;
    }
  }

  /**
   * Clear balance display
   */
  clearBalance(): void {
    this.selectedBalanceAccount = null;
    this.balanceCheckAccountInput = '';
    this.filteredBalanceAccounts = [];
    this.showBalanceSuggestions = false;
  }

  /**
   * Autocomplete for Record Transaction Account
   */
  onRecordTxnAccountInput(): void {
    const input = this.recordTxnAccountInput.trim();
    if (!input) {
      this.filteredRecordTxnAccounts = [];
      this.showRecordTxnSuggestions = false;
      return;
    }

    const accounts = (this.officerSvc as any).accountsSubject?.value || [];
    const active = accounts.filter((a: any) => a.status === 'ACTIVE');
    const query = input.toUpperCase();
    
    this.filteredRecordTxnAccounts = active.filter((a: any) =>
      a.accountId.toUpperCase().includes(query) || 
      a.customerName.toUpperCase().includes(query)
    );
    this.showRecordTxnSuggestions = this.filteredRecordTxnAccounts.length > 0;
  }

  selectRecordTxnAccount(accountId: string): void {
    this.recordTxnAccountInput = accountId;
    this.showRecordTxnSuggestions = false;
    this.filteredRecordTxnAccounts = [];
  }

  hideRecordTxnSuggestions(): void {
    setTimeout(() => { this.showRecordTxnSuggestions = false; }, 200);
  }

  /**
   * Autocomplete for Balance Check Account
   */
  onBalanceAccountInput(): void {
    const input = this.balanceCheckAccountInput.trim();
    if (!input) {
      this.filteredBalanceAccounts = [];
      this.showBalanceSuggestions = false;
      return;
    }

    const accounts = (this.officerSvc as any).accountsSubject?.value || [];
    const query = input.toUpperCase();
    
    this.filteredBalanceAccounts = accounts.filter((a: any) =>
      a.accountId.toUpperCase().includes(query) || 
      a.customerName.toUpperCase().includes(query)
    );
    this.showBalanceSuggestions = this.filteredBalanceAccounts.length > 0;
  }

  selectBalanceAccount(accountId: string): void {
    this.balanceCheckAccountInput = accountId;
    this.showBalanceSuggestions = false;
    this.filteredBalanceAccounts = [];
  }

  hideBalanceSuggestions(): void {
    setTimeout(() => { this.showBalanceSuggestions = false; }, 200);
  }
}
 