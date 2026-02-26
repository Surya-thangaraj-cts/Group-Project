import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerTransactionsService, Transaction, PagedResult } from '../../services/manager-transactions.service';

interface FilterCriteria {
  startDate: string;
  endDate: string;
  minAmount: number | null;
  maxAmount: number | null;
  transactionType: string;
  status: string;
}

interface ReportStatistics {
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  completedCount: number;
  pendingCount: number;
  depositCount: number;
  withdrawalCount: number;
  transferCount: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  filterCriteria: FilterCriteria = {
    startDate: '',
    endDate: '',
    minAmount: null,
    maxAmount: null,
    transactionType: '',
    status: ''
  };

  reportSummary: ReportStatistics = {
    totalCount: 0,
    totalAmount: 0,
    averageAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    depositCount: 0,
    withdrawalCount: 0,
    transferCount: 0
  };

  isLoading: boolean = false;
  errorMessage: string = '';

  transactionTypes: string[] = ['Deposit', 'Withdrawal', 'Transfer'];
  statuses: { label: string; value: string }[] = [
    { label: 'Completed', value: '0' },
    { label: 'Pending', value: '1' },
    { label: 'Rejected', value: '2' },
    { label: 'Failed', value: '3' }
  ];

  constructor(private managerTransactionsService: ManagerTransactionsService) {}

  ngOnInit(): void {
    this.generateReport();
  }

  generateReport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const params: any = {
      pageNumber: 1,
      pageSize: 10000 // Fetch all for statistics calculation
    };

    if (this.filterCriteria.startDate) params.startDate = this.filterCriteria.startDate;
    if (this.filterCriteria.endDate) params.endDate = this.filterCriteria.endDate;
    if (this.filterCriteria.minAmount !== null) params.minAmount = this.filterCriteria.minAmount;
    if (this.filterCriteria.maxAmount !== null) params.maxAmount = this.filterCriteria.maxAmount;
    if (this.filterCriteria.transactionType) params.type = this.filterCriteria.transactionType;
    if (this.filterCriteria.status) params.status = this.filterCriteria.status;

    this.managerTransactionsService.getTransactions(params).subscribe({
      next: (result: PagedResult<Transaction>) => {
        this.calculateStatistics(result.items);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load report statistics.';
        this.isLoading = false;
      }
    });
  }

  private calculateStatistics(transactions: Transaction[]): void {
    const stats: ReportStatistics = {
      totalCount: transactions.length,
      totalAmount: 0,
      averageAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      depositCount: 0,
      withdrawalCount: 0,
      transferCount: 0
    };

    transactions.forEach(txn => {
      stats.totalAmount += txn.amount;

      // Status: 0=Completed, 1=Pending, 2=Rejected, 3=Failed
      if (txn.status === 0) stats.completedCount++;
      if (txn.status === 1) stats.pendingCount++;

      // Type counts
      if (txn.type === 'Deposit') stats.depositCount++;
      if (txn.type === 'Withdrawal') stats.withdrawalCount++;
      if (txn.type === 'Transfer') stats.transferCount++;
    });

    stats.averageAmount = stats.totalCount > 0 ? stats.totalAmount / stats.totalCount : 0;
    this.reportSummary = stats;
  }

  resetFilters(): void {
    this.filterCriteria = {
      startDate: '',
      endDate: '',
      minAmount: null,
      maxAmount: null,
      transactionType: '',
      status: ''
    };
    this.generateReport();
  }

  exportToCSV(): void {
    if (this.reportSummary.totalCount === 0) {
      this.errorMessage = 'No data available to download.';
      return;
    }
    const filters = this.buildFilters();
    this.managerTransactionsService.exportToCSV(filters);
  }

  exportToExcel(): void {
    if (this.reportSummary.totalCount === 0) {
      this.errorMessage = 'No data available to download.';
      return;
    }
    const filters = this.buildFilters();
    this.managerTransactionsService.exportToExcel(filters);
  }

  private buildFilters(): any {
    const filters: any = {};
    if (this.filterCriteria.startDate) filters.startDate = this.filterCriteria.startDate;
    if (this.filterCriteria.endDate) filters.endDate = this.filterCriteria.endDate;
    if (this.filterCriteria.minAmount !== null) filters.minAmount = this.filterCriteria.minAmount;
    if (this.filterCriteria.maxAmount !== null) filters.maxAmount = this.filterCriteria.maxAmount;
    if (this.filterCriteria.transactionType) filters.type = this.filterCriteria.transactionType;
    if (this.filterCriteria.status) filters.status = this.filterCriteria.status;
    return filters;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
}