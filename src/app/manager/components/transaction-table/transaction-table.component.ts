import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DataService, Transaction } from '../../services/data.service';

@Component({
  selector: 'app-transaction-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './transaction-table.component.html',
  styleUrl: './transaction-table.component.css'
})
export class TransactionTableComponent implements OnInit {
  displayedColumns: string[] = ['id', 'accountId', 'type', 'amount', 'date', 'status'];
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  pageSize = 5;
  currentPage = 0;
  Math = Math;

  searchText = '';
  selectedStatus = '';
  minAmount = '';
  maxAmount = '';
  startDate: Date | null = null;
  endDate: Date | null = null;
  viewMode: 'all' | 'highvalue' = 'all';

  statuses = ['Approved', 'Pending', 'Rejected'];
  types = ['Deposit', 'Withdrawal', 'Transfer'];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.dataService.getTransactions().subscribe(data => {
      this.transactions = data;
      this.applyFilters();
    });
  }

  applyFilters() {
    this.filteredTransactions = this.transactions.filter(txn => {
      // Apply high-value filter
      if (this.viewMode === 'highvalue' && txn.amount <= 100000) {
        return false;
      }

      const matchesSearch = 
        txn.id.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (txn.accountId && txn.accountId.toLowerCase().includes(this.searchText.toLowerCase()));

      const matchesStatus = !this.selectedStatus || txn.status === this.selectedStatus;

      const amount = txn.amount;
      const min = this.minAmount ? parseFloat(this.minAmount) : 0;
      const max = this.maxAmount ? parseFloat(this.maxAmount) : Infinity;
      const matchesAmount = amount >= min && amount <= max;

      const txnDate = new Date(txn.date);
      const matchesDate = 
        (!this.startDate || txnDate >= this.startDate) &&
        (!this.endDate || txnDate <= this.endDate);

      return matchesSearch && matchesStatus && matchesAmount && matchesDate;
    });

    this.currentPage = 0;
  }

  toggleHighValueFilter(mode: 'all' | 'highvalue'): void {
    this.viewMode = mode;
    this.applyFilters();
  }

  getHighValueCount(): number {
    return this.transactions.filter(t => t.amount > 100000).length;
  }

  get paginatedTransactions() {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredTransactions.slice(start, end);
  }

  get totalItems() {
    return this.filteredTransactions.length;
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onSort(sort: Sort) {
    if (!sort.active || sort.direction === '') {
      return;
    }

    this.filteredTransactions.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const aValue = (a as any)[sort.active];
      const bValue = (b as any)[sort.active];

      if (aValue < bValue) {
        return isAsc ? -1 : 1;
      }
      if (aValue > bValue) {
        return isAsc ? 1 : -1;
      }
      return 0;
    });
  }

  getStatusClass(status: string): string {
    if (status === 'Approved') {
      return 'status-approved';
    }
    if (status === 'Pending') {
      return 'status-pending';
    }
    if (status === 'Rejected') {
      return 'status-rejected';
    }
    return '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  formatAmount(amount: number): string {
    return '₹' + amount.toLocaleString();
  }

  resetFilters() {
    this.searchText = '';
    this.selectedStatus = '';
    this.minAmount = '';
    this.maxAmount = '';
    this.startDate = null;
    this.endDate = null;
    this.applyFilters();
  }

  exportToCSV() {
    this.dataService.exportToCSV(this.filteredTransactions, 'transactions.csv');
  }

  exportToExcel() {
    this.dataService.exportToExcel(this.filteredTransactions, 'transactions.xlsx');
  }
}