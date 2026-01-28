
// src/app/features/officer/transactions/transactions.component.ts
import { Component, inject, ViewEncapsulation } from '@angular/core';
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
  // encapsulation: ViewEncapsulation.None
})
export class TransactionsComponent {
  // Services
  private fb = inject(FormBuilder);
  private officerSvc = inject(OfficerService);

  // Streams
  accounts$ = this.officerSvc.accounts$;
  transactions$ = this.officerSvc.transactions$;

  // Record form
  txnForm: FormGroup = this.fb.group({
    type: ['DEPOSIT' as TxnType, [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    toAccountId: [undefined],
    narrative: ['']
  });

  selectedHistoryAccountId?: string;
  highValueThreshold = this.officerSvc.highValueThreshold;

  // ----- Filters (bind to ngModel; also push into subjects for VM) -----
  historyFilterAccountId?: string;
  fromDate?: string; // yyyy-MM-dd
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

  // ----- Pagination (Transaction History) -----
  txPageSizeOptions = [5, 10, 20];
  private txPageIndex$ = new BehaviorSubject<number>(1);  // 1-based
  private txPageSize$ = new BehaviorSubject<number>(10);  // default 10

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

      // Apply filters
      const filtered = list.filter(t => {
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

  // ----- Pagination handlers -----
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

  // ----- Record form helpers -----
  onTxnTypeChange() {
    if (this.txnForm.value.type !== 'TRANSFER') {
      this.txnForm.patchValue({ toAccountId: undefined });
    }
  }

  resetTxnForm(): void {
    this.txnForm.reset({ type: 'DEPOSIT', amount: 0, toAccountId: undefined, narrative: '' });
  }

  recordTransaction(): void {
    try {
      this.officerSvc.recordTransaction(
        this.selectedHistoryAccountId!,
        this.txnForm.getRawValue()
      );
      this.resetTxnForm();
      // Optional: you can scroll to top or keep position; pagination is unaffected.
    } catch (e: any) {
      this.officerSvc.setError(e?.message || 'Failed to record transaction');
    }
  }

  // Removed toggleFlag handler per your request (flag pill is now read-only)

  // TrackBy
  trackByTxnId(index: number, t: Transaction) {
    return t?.id ?? index;
  }
}
``
