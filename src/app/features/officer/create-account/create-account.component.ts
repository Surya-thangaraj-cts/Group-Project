import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OfficerService } from '../officer.service';
import { AccountType, AccountStatus } from '../model';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
 
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
 
@Component({
  selector: 'create-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './create-account.component.html',
  styleUrls: ['../officer-theme.css'],
})
export class CreateAccountComponent {
  private officerSvc = inject(OfficerService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
 
  createForm: FormGroup = this.fb.group({
    accountId: ['', [Validators.required, Validators.minLength(3)]],
    customerName: ['', [Validators.required]],
    customerId: ['', [Validators.required]],
    accountType: ['SAVINGS' as AccountType, [Validators.required]],
    balance: [0, [Validators.required, Validators.min(0)]],
    status: ['ACTIVE' as AccountStatus, [Validators.required]],
  });
 
  submitted = false;
 
  // Source stream alias
  accounts$ = this.officerSvc.accounts$;
 
 
  statusFilter: StatusFilter = 'ALL';
  private statusFilter$ = new BehaviorSubject<StatusFilter>('ALL');
 
  searchTerm = '';
  private searchTerm$ = new BehaviorSubject<string>('');
 
  onStatusFilterChange(val: StatusFilter | string) {
    const v = (val as StatusFilter) ?? 'ALL';
    this.statusFilter = v;
    this.statusFilter$.next(v);
    this.pageIndex$.next(1);
  }
 
  onSearchChange(val: string) {
    this.searchTerm = val ?? '';
    if ((this.searchTerm || '').trim() === '') {
      // auto reset when cleared
      this.searchTerm$.next('');
      this.pageIndex$.next(1);
    }
  }
 
  onSearchSubmit() {
    const val = (this.searchTerm || '').trim();
    this.searchTerm$.next(val);
    this.pageIndex$.next(1);
  }
 
  clearSearch() {
    this.searchTerm = '';
    this.searchTerm$.next('');
    this.pageIndex$.next(1);
  }
 
  // -------- Pagination state --------
  pageSizeOptions = [5, 10, 20];
  private pageIndex$ = new BehaviorSubject<number>(1);   // 1-based index
  private pageSize$ = new BehaviorSubject<number>(10);   // ideal default rows
 
  // ViewModel stream with filter + pagination
  vm$: Observable<{
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    pageData: any[];
    from: number;
    to: number;
    pages: number[];
  }> = combineLatest([this.accounts$, this.statusFilter$, this.searchTerm$, this.pageIndex$, this.pageSize$]).pipe(
    map(([accounts, sFilter, search, pageIndex, pageSize]) => {
      const list: any[] = Array.isArray(accounts) ? [...accounts] : [];
 
      // Normalize search (accountId, customerName, customerId)
      const norm = (v: unknown) => String(v ?? '').toLowerCase().trim();
      const q = norm(search);
 
      const filtered = list.filter(a => {
        if (sFilter === 'ACTIVE' && a.status !== 'ACTIVE') return false;
        if (sFilter === 'INACTIVE' && a.status !== 'CLOSED') return false;
 
        if (q) {
          const id = norm(a.accountId);
          const name = norm(a.customerName);
          const cid = norm(a.customerId);
          if (!(id.includes(q) || name.includes(q) || cid.includes(q))) return false;
        }
        return true;
      });
 
      // Sort: latest opened first
      filtered.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
 
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
 
  // -------- Form helpers --------
  defaultCreateForm() {
    return {
      accountId: '',
      customerName: '',
      customerId: '',
      accountType: 'SAVINGS' as AccountType,
      balance: 0,
      status: 'ACTIVE' as AccountStatus,
    };
  }
 
  createAccount(): void {
    this.submitted = true;
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const value = this.createForm.getRawValue();
    try {
      this.officerSvc.createAccount(value);
      this.submitted = false;
      this.createForm.reset(this.defaultCreateForm());
      this.createForm.markAsPristine();
      this.createForm.markAsUntouched();
    } catch (e: any) {
      this.officerSvc.setError(e?.message || 'Failed to create account');
    }
  }
 
  prefillUpdate(accountId: string) {
    this.router.navigate(['/officer/update'], { queryParams: { accountId } });
  }
 
  // -------- Pagination handlers --------
  setPage(page: number): void {
    this.pageIndex$.next(page);
  }
 
  prevPage(): void {
    this.pageIndex$.next(Math.max(1, this.pageIndex$.getValue() - 1));
  }
 
  nextPage(): void {
    this.pageIndex$.next(this.pageIndex$.getValue() + 1);
  }
 
  onPageSizeChange(ev: Event): void {
    const target = ev.target as HTMLSelectElement;
    const size = Number(target.value) || 10;
    this.pageSize$.next(size);
    this.pageIndex$.next(1);
  }
 
  // TrackBy for performance
  trackByAccountId(index: number, a: any) {
    return a?.accountId ?? index;
  }
}
 
 