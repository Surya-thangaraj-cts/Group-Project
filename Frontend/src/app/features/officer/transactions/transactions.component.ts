 
 
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

  selectedHistoryAccountId?: string;
  highValueThreshold = this.officerSvc.highValueThreshold;
  toAccountStatus: 'internal' | 'external' | null = null;
  filteredToAccounts: any[] = [];
  showToSuggestions = false;

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
        if (t.status === 'Pending') return false;
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
      a.accountId !== this.selectedHistoryAccountId &&
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
  }

  recordTransaction(): void {
    const formVal = this.txnForm.getRawValue();
    if (formVal.type === 'TRANSFER') {
      const toId = (formVal.toAccountId || '').trim();
      if (!toId) {
        this.officerSvc.setError('Please enter a destination Account ID for the transfer.');
        return;
      }
      if (toId === this.selectedHistoryAccountId) {
        this.officerSvc.setError('Cannot transfer to the same account.');
        return;
      }
      formVal.toAccountId = toId;
    }
    try {
      this.officerSvc.recordTransaction(
        this.selectedHistoryAccountId!,
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
}
 