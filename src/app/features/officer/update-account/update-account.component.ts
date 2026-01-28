
// src/app/features/officer/update-account/update-account.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { OfficerService } from '../officer.service';
import { AccountType, AccountStatus, Account, UpdateRequest } from '../model';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, take } from 'rxjs/operators';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'update-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './update-account.component.html',
  styleUrls: ['../officer-theme.css'],
})
export class UpdateAccountComponent implements OnInit {
  private fb = inject(FormBuilder);
  private officerSvc = inject(OfficerService);
  private route = inject(ActivatedRoute);

  // Lookup input (two-way bound via ngModel)
  lookupAccountId = '';

  // Form
  updateFormLoaded = false;
  updateForm: FormGroup = this.fb.group({
    accountId: [{ value: '', disabled: false }, [Validators.required]],
    customerName: ['', [Validators.required]],
    customerId: ['', [Validators.required]],
    accountType: ['SAVINGS' as AccountType, [Validators.required]],
    balance: [0, [Validators.required, Validators.min(0)]],
    status: ['ACTIVE' as AccountStatus, [Validators.required]],
  });

  // Streams
  accounts$ = this.officerSvc.accounts$;
  updateRequests$: Observable<UpdateRequest[]> = this.officerSvc.updateRequests$;

  // ---------- Status filter for Updation Status ----------
  statusFilter: StatusFilter = 'ALL';
  private statusFilter$ = new BehaviorSubject<StatusFilter>('ALL');
  onStatusFilterChange(val: StatusFilter | string) {
    const v = (val as StatusFilter) ?? 'ALL';
    this.statusFilter = v;
    this.statusFilter$.next(v);
    this.urPageIndex$.next(1);
  }

  // ---------- Pagination (Updation Status) ----------
  urPageSizeOptions = [5, 10, 20];
  private urPageIndex$ = new BehaviorSubject<number>(1);  // 1-based
  private urPageSize$ = new BehaviorSubject<number>(10);  // default 10

  urVm$: Observable<{
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    pageData: UpdateRequest[];
    from: number;
    to: number;
    pages: number[];
  }> = combineLatest([this.updateRequests$, this.statusFilter$, this.urPageIndex$, this.urPageSize$]).pipe(
    map(([list, sFilter, pageIndex, pageSize]) => {
      const data = Array.isArray(list) ? [...list] : [];

      // Filter by status first
      const filtered = data.filter(u => {
        if (sFilter === 'PENDING' && u.status !== 'PENDING') return false;
        if (sFilter === 'APPROVED' && u.status !== 'APPROVED') return false;
        if (sFilter === 'REJECTED' && u.status !== 'REJECTED') return false;
        return true;
      });

      // latest first (by time)
      filtered.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const currentPage = Math.min(Math.max(1, pageIndex), totalPages);
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const pageData = filtered.slice(start, end);
      const from = total ? start + 1 : 0;
      const to = Math.min(end, total);
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
      return { total, totalPages, currentPage, pageSize, pageData, from, to, pages };
    })
  );

  ngOnInit(): void {
    // Optional: auto-load if query param present
    const qpId = this.route.snapshot.queryParamMap.get('accountId');
    if (qpId && qpId.trim()) {
      this.lookupAccountId = qpId;
      this.prefillUpdate(qpId);
    }
  }

  // ---------- Load account into form ----------
  prefillUpdate(accountId: string): void {
    const id = (accountId || '').trim();
    if (!id) return;

    this.accounts$.pipe(take(1)).subscribe({
      next: (accounts: Account[] = []) => {
        const found = accounts.find(a => a.accountId === id);
        if (!found) {
          this.officerSvc.setError(`Account "${id}" not found`);
          this.updateFormLoaded = false;
          return;
        }
        this.updateForm.reset({
          accountId: found.accountId,
          customerName: found.customerName,
          customerId: found.customerId,
          accountType: found.accountType,
          balance: found.balance ?? 0,
          status: found.status,
        });
        this.updateForm.markAsPristine();
        this.updateForm.markAsUntouched();
        this.updateFormLoaded = true;
      },
      error: () => {
        this.officerSvc.setError('Failed to load account');
        this.updateFormLoaded = false;
      }
    });
  }

  // ---------- Submit Update Request ----------
  submitUpdateRequest(): void {
    if (!this.updateFormLoaded) return;
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      return;
    }
    const payload = this.updateForm.getRawValue();
    try {
      this.officerSvc.submitUpdateRequest(payload);
      this.updateForm.markAsPristine();
      this.updateForm.markAsUntouched();
      // Optionally force the filter to Pending to surface the new record
      // this.onStatusFilterChange('PENDING');
    } catch (e: any) {
      this.officerSvc.setError(e?.message || 'Failed to submit update request');
    }
  }

  cancel(): void {
    this.updateFormLoaded = false;
    this.updateForm.reset({
      accountId: '',
      customerName: '',
      customerId: '',
      accountType: 'SAVINGS' as AccountType,
      balance: 0,
      status: 'ACTIVE' as AccountStatus,
    });
  }

  // ---------- Pagination handlers (Updation Status) ----------
  urSetPage(page: number): void { this.urPageIndex$.next(page); }
  urPrevPage(): void { this.urPageIndex$.next(Math.max(1, this.urPageIndex$.getValue() - 1)); }
  urNextPage(): void { this.urPageIndex$.next(this.urPageIndex$.getValue() + 1); }
  onUrPageSizeChange(ev: Event): void {
    const size = Number((ev.target as HTMLSelectElement).value) || 10;
    this.urPageSize$.next(size);
    this.urPageIndex$.next(1);
  }

  // TrackBy for performance
  trackByUpdateId(index: number, u: UpdateRequest) {
    return u?.updateId ?? index;
  }
}
