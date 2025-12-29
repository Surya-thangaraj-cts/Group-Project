import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../auth/auth.service';
import { TransactionService, Transaction } from '../services/transaction.service';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private txService = inject(TransactionService);

  currentUser: User | null = this.auth.getCurrentUser();
  transactions: Transaction[] = [];
  // Search & sort
  searchTerm: string = '';
  sortField: 'date' | 'amount' | 'transactionId' | 'accountId' | 'type' | 'status' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  // Filters
  dateFrom: string | null = null; // yyyy-MM-dd
  dateTo: string | null = null;   // yyyy-MM-dd
  statusFilter: '' | 'Completed' | 'Pending' | 'Failed' = '';
  typeFilter: '' | 'Deposit' | 'Withdrawal' | 'Transfer' = '';

  ngOnInit(): void {
    this.transactions = this.txService.getAll();
  }

  // Returns filtered and sorted transactions for the template
  get filteredTransactions(): Transaction[] {
    const q = (this.searchTerm || '').trim().toLowerCase();
    let out = this.transactions.slice();
    // Apply status filter
    if (this.statusFilter) {
      out = out.filter(t => t.status === this.statusFilter);
    }

    // Apply type filter
    if (this.typeFilter) {
      out = out.filter(t => t.type === this.typeFilter);
    }

    // Apply date range filter (inclusive)
    if (this.dateFrom) {
      const from = new Date(this.dateFrom);
      out = out.filter(t => new Date(t.date) >= from);
    }
    if (this.dateTo) {
      // include entire day for dateTo by setting time to end of day
      const to = new Date(this.dateTo);
      to.setHours(23,59,59,999);
      out = out.filter(t => new Date(t.date) <= to);
    }

    if (q) {
      out = out.filter(t => {
        return (
          t.transactionId.toLowerCase().includes(q) ||
          t.accountId.toLowerCase().includes(q) ||
          t.type.toLowerCase().includes(q) ||
          t.status.toLowerCase().includes(q) ||
          String(t.amount).toLowerCase().includes(q) ||
          new Date(t.date).toLocaleString().toLowerCase().includes(q)
        );
      });
    }

    const dir = this.sortDirection === 'asc' ? 1 : -1;
    out.sort((a, b) => {
      switch (this.sortField) {
        case 'amount':
          return (a.amount - b.amount) * dir;
        case 'date':
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
        case 'transactionId':
          return a.transactionId.localeCompare(b.transactionId) * dir;
        case 'accountId':
          return a.accountId.localeCompare(b.accountId) * dir;
        case 'type':
          return a.type.localeCompare(b.type) * dir;
        case 'status':
          return a.status.localeCompare(b.status) * dir;
        default:
          return 0;
      }
    });

    return out;
  }

  setSort(field: typeof this.sortField) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
  }

  isManager(): boolean {
    return !!this.currentUser && this.currentUser.role === 'bankManager';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/landing']);
  }

}
