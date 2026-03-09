import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ManagerTransactionsService, Transaction } from '../../services/manager-transactions.service';


@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.css'
})
export class TransactionTableComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'accountId', 'type', 'amount', 'date', 'status', 'flag'];
  transactions: Transaction[] = [];
  pageSize = 5;
  currentPage = 1; // 1-based
  totalPages = 0;
  totalCount = 0;
  loading = false;
  searchText = '';
  selectedStatus = '';
  selectedType = '';
  minAmount = '';
  maxAmount = '';
  startDate = '';
  endDate = '';
  viewMode: 'all' | 'highvalue' = 'all';
  highValueCount = 0;
  statuses = ['Completed', 'Pending', 'Rejected', 'Failed'];
  types = ['Deposit', 'Withdrawal', 'Transfer'];
  private destroy$ = new Subject<void>();

  constructor(private transactionService: ManagerTransactionsService) {}

  ngOnInit() {
    this.loadTransactions();
    this.loadHighValueCount();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTransactions() {
    this.loading = true;
    const params = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      searchText: this.searchText || undefined,
      status: this.selectedStatus || undefined,
      type: this.selectedType || undefined,
      minAmount: this.minAmount ? parseFloat(this.minAmount) : undefined,
      maxAmount: this.maxAmount ? parseFloat(this.maxAmount) : undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      viewMode: this.viewMode
    };
    this.transactionService.getTransactions(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Sort transactions by date descending (newest first)
          this.transactions = result.items.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          this.totalCount = result.totalCount;
          this.totalPages = result.totalPages;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  loadHighValueCount() {
    this.transactionService.getHighValueCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => this.highValueCount = result.highValueCount);
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadTransactions();
  }

  toggleHighValueFilter(mode: 'all' | 'highvalue') {
    this.viewMode = mode;
    this.applyFilters();
  }

  resetFilters() {
    this.searchText = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.minAmount = '';
    this.maxAmount = '';
    this.startDate = '';
    this.endDate = '';
    this.viewMode = 'all';
    this.applyFilters();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTransactions();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTransactions();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTransactions();
    }
  }

  exportToCSV() {
    const filters = {
      searchText: this.searchText || undefined,
      status: this.selectedStatus || undefined,
      type: this.selectedType || undefined,
      minAmount: this.minAmount ? parseFloat(this.minAmount) : undefined,
      maxAmount: this.maxAmount ? parseFloat(this.maxAmount) : undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      viewMode: this.viewMode
    };
    this.transactionService.exportToCSV(filters);
  }

  exportToExcel() {
    const filters = {
      searchText: this.searchText || undefined,
      status: this.selectedStatus || undefined,
      type: this.selectedType || undefined,
      minAmount: this.minAmount ? parseFloat(this.minAmount) : undefined,
      maxAmount: this.maxAmount ? parseFloat(this.maxAmount) : undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      viewMode: this.viewMode
    };
    this.transactionService.exportToExcel(filters);
  }

  getStatusClass(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'status-completed',
      1: 'status-pending',
      2: 'status-rejected',
      3: 'status-failed'
    };
    return statusMap[status] || '';
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Completed',
      1: 'Pending',
      2: 'Rejected',
      3: 'Failed'
    };
    return statusMap[status] || 'Unknown';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatAmount(amount: number): string {
    return '₹' + amount.toLocaleString();
  }
}