
// src/app/features/officer/create-account/create-account.component.ts
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OfficerService } from '../officer.service';
import { AccountType, AccountStatus } from '../model';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'create-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-account.component.html',
  styleUrls: ['../officer-theme.css'],
  // encapsulation: ViewEncapsulation.None
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

  // original stream of accounts from service
  accounts$ = this.officerSvc.accounts$;

  // -------- Pagination state --------
  pageSizeOptions = [5, 10, 20];
  private pageIndex$ = new BehaviorSubject<number>(1);   // 1-based index
  private pageSize$ = new BehaviorSubject<number>(10);   // ideal default rows

  // ViewModel stream with pagination-derived data
  vm$: Observable<{
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    pageData: any[];
    from: number;
    to: number;
    pages: number[];
  }> = combineLatest([this.accounts$, this.pageIndex$, this.pageSize$]).pipe(
    map(([accounts, pageIndex, pageSize]) => {
      const list: any[] = Array.isArray(accounts) ? accounts : [];
      const total = list.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const currentPage = Math.min(Math.max(1, pageIndex), totalPages);
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      const pageData = list.slice(start, end);
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

      // After adding a new item, jump to last page so the new row is visible
      // We can't compute totalPages here without the array, but the Next click will clamp.
      // Optionally, you can subscribe once to accounts$ to compute and set last page.
      // For now, keep current page and let the user navigate.
    } catch (e: any) {
      this.officerSvc.setError(e?.message || 'Failed to create account');
    }
  }

  prefillUpdate(accountId: string) {
    this.router.navigate(['/officer/update'], { queryParams: { accountId } });
  }

  // -------- Pagination handlers --------
  setPage(page: number): void {
    // Clamp is handled in VM mapping; this keeps intent simple.
    this.pageIndex$.next(page);
  }

  prevPage(): void {
    this.pageIndex$.next(Math.max(1, this.pageIndex$.getValue() - 1));
  }

  nextPage(): void {
    // Will be clamped by VM if it exceeds totalPages; buttons are disabled at the end anyway.
    this.pageIndex$.next(this.pageIndex$.getValue() + 1);
  }

  onPageSizeChange(ev: Event): void {
    const target = ev.target as HTMLSelectElement;
    const size = Number(target.value) || 10;
    this.pageSize$.next(size);
    this.pageIndex$.next(1); // reset to first page on page size change
  }

  // TrackBy for performance
  trackByAccountId(index: number, a: any) {
    return a?.accountId ?? index;
  }
}
