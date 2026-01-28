 
// src/app/features/officer/alerts/alerts.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerService } from '../officer.service';
import { Notification, NotificationType } from '../model';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
 
type ReadFilter = 'ALL' | 'UNREAD' | 'READ';
// Removed 'TXN_FLAGGED' from the type filter options
type TypeFilter = 'ALL' | 'UPDATE_REQUEST' | 'HIGH_VALUE_TXN';
 
@Component({
  selector: 'alerts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['../officer-theme.css'],
})
export class AlertsComponent {
  private officerSvc = inject(OfficerService);
 
  // Streams
  notifications$ = this.officerSvc.notifications$;
 
  // Filters
  readFilter: ReadFilter = 'ALL';
  typeFilter: TypeFilter = 'ALL';
  private readFilter$ = new BehaviorSubject<ReadFilter>('ALL');
  private typeFilter$ = new BehaviorSubject<TypeFilter>('ALL');
 
  // Search
  searchTerm = '';
  private searchTerm$ = new BehaviorSubject<string>('');
 
  onReadFilterChange(val: ReadFilter | string) {
    const v = (val as ReadFilter) ?? 'ALL';
    this.readFilter = v;
    this.readFilter$.next(v);
    this.pageIndex$.next(1);
  }
 
  onTypeFilterChange(val: TypeFilter | string) {
    const v = (val as TypeFilter) ?? 'ALL';
    this.typeFilter = v;
    this.typeFilter$.next(v);
    this.pageIndex$.next(1);
  }
 
  // When typing: if user clears the field, reset search immediately
  onSearchChange(val: string) {
    this.searchTerm = val ?? '';
    if ((this.searchTerm || '').trim() === '') {
      this.searchTerm$.next('');
      this.pageIndex$.next(1);
    }
  }
 
  // Explicit search by button or Enter
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
 
  // Pagination
  pageSizeOptions = [5, 10, 20];
  private pageIndex$ = new BehaviorSubject<number>(1); // 1-based
  private pageSize$ = new BehaviorSubject<number>(10);
 
  onPageSizeChange(ev: Event) {
    const size = Number((ev.target as HTMLSelectElement).value) || 10;
    this.pageSize$.next(size);
    this.pageIndex$.next(1);
  }
  setPage(p: number) { this.pageIndex$.next(p); }
  prevPage() { this.pageIndex$.next(Math.max(1, this.pageIndex$.getValue() - 1)); }
  nextPage() { this.pageIndex$.next(this.pageIndex$.getValue() + 1); }
 
  // View model
  vm$: Observable<{
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    pageData: Notification[];
    from: number;
    to: number;
    pages: number[];
  }> = combineLatest([
    this.notifications$,
    this.readFilter$,
    this.typeFilter$,
    this.searchTerm$,
    this.pageIndex$,
    this.pageSize$,
  ]).pipe(
    map(([list, rFilter, tFilter, search, pageIndex, pageSize]) => {
      const data = Array.isArray(list) ? [...list] : [];
 
      // latest first
      data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
 
      // Normalizer: handle numbers, spaces, hyphens
      const norm = (s: unknown) => String(s ?? '').replace(/[\s-]/g, '').toLowerCase();
      const q = norm(search);
 
      const filtered = data.filter(n => {
        // Remove Manual Flag from filtering: the UI doesn't expose it anymore.
        // If a notification with type 'TXN_FLAGGED' exists, it will only show when Type = ALL.
        if (rFilter === 'UNREAD' && n.read) return false;
        if (rFilter === 'READ' && !n.read) return false;
 
        if (tFilter !== 'ALL') {
          if (n.type !== tFilter) return false;
        }
 
        if (q) {
          const acct = norm(n.meta?.accountId);
          if (!acct.includes(q)) return false;
        }
        return true;
      });
 
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
 
  // Actions
  markAllAsRead() { this.officerSvc.markAllAsRead(); }
  clearAll() { this.officerSvc.clearAllNotifications(); }
  markAsRead(id: string) { this.officerSvc.markAsRead(id); }
  markAsUnread(id: string) { this.officerSvc.markAsUnread(id); }
  delete(id: string) { this.officerSvc.deleteNotification(id); }
 
  // TrackBy
  trackById(i: number, n: Notification) { return n?.id ?? i; }
 
  // Helpers for display
  typeLabel(t: NotificationType) {
    if (t === 'UPDATE_REQUEST') return 'Update Request';
    if (t === 'HIGH_VALUE_TXN') return 'High-value Txn';
    // We’re not showing Manual Flag category in the filter UI;
    // if any exist and Type=ALL, we can still show a neutral label.
    return 'Txn Flag';
  }
 
  // Status (default 'Pending' for UPDATE_REQUEST and HIGH_VALUE_TXN)
  statusLabelFor(n: Notification) {
    if (n.type === 'UPDATE_REQUEST' || n.type === 'HIGH_VALUE_TXN') return 'Pending';
    return null; // no status for others
  }
}
 
 