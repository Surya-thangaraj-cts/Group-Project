import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

interface FilterCriteria {
  fromDate: string;
  toDate: string;
  month: string;
  branch: string;
  minAmount: number | null;
  maxAmount: number | null;
  accountType: string;
  transactionType: string;
  status: string;
}

interface ReportSummary {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  completedCount: number;
  pendingCount: number;
  depositCount: number;
  withdrawalCount: number;
  transferCount: number;
}

interface Transaction {
  id: string;
  accountId: string;
  customerName: string;
  type: string;
  amount: number;
  branch: string;
  date: string;
  status: string;
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
    fromDate: '',
    toDate: '',
    month: '',
    branch: '',
    minAmount: null,
    maxAmount: null,
    accountType: '',
    transactionType: '',
    status: ''
  };

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  reportSummary: ReportSummary = {
    totalTransactions: 0,
    totalAmount: 0,
    averageAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    depositCount: 0,
    withdrawalCount: 0,
    transferCount: 0
  };

  currentPage: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 0;
  paginatedTransactions: Transaction[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  branches: string[] = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
  accountTypes: string[] = ['ACC1001', 'ACC1002', 'ACC1003', 'ACC1004', 'ACC1005', 'ACC1006', 'ACC1007', 'ACC1008', 'ACC1009', 'ACC1010'];
  transactionTypes: string[] = ['Deposit', 'Withdrawal', 'Transfer'];
  statuses: string[] = ['Completed', 'Pending', 'Failed'];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadDataFromService();
  }

  loadDataFromService(): void {
    this.dataService.getTransactions().subscribe(dsTransactions => {
      // Convert DataService transactions to Reports format
      this.transactions = dsTransactions.map((txn, index) => {
        const branchNames = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
        const branch = branchNames[index % branchNames.length];
        
        // Convert status from DataService format to Reports format
        const statusMap: { [key: string]: string } = {
          'Approved': 'Completed',
          'Pending': 'Pending',
          'Rejected': 'Failed'
        };
        
        return {
          id: txn.id,
          accountId: txn.accountId,
          customerName: txn.user,
          type: txn.type,
          amount: txn.amount,
          branch: branch,
          date: txn.date.toISOString().split('T')[0],
          status: statusMap[txn.status] || txn.status
        };
      });
      
      this.generateReport();
    });
  }

  generateReport(): void {
    this.filteredTransactions = this.filterTransactions();
    this.reportSummary = this.calculateSummary();
    this.updatePagination();
  }

  filterTransactions(): Transaction[] {
    return this.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const fromDate = this.filterCriteria.fromDate ? new Date(this.filterCriteria.fromDate) : null;
      const toDate = this.filterCriteria.toDate ? new Date(this.filterCriteria.toDate) : null;

      // Date range filter
      if (fromDate && transactionDate < fromDate) return false;
      if (toDate) {
        const nextDay = new Date(toDate);
        nextDay.setDate(nextDay.getDate() + 1);
        if (transactionDate >= nextDay) return false;
      }

      // Month filter
      if (this.filterCriteria.month) {
        const [year, month] = this.filterCriteria.month.split('-');
        if (transactionDate.getFullYear() !== parseInt(year) || 
            transactionDate.getMonth() !== parseInt(month) - 1) {
          return false;
        }
      }

      // Branch filter
      if (this.filterCriteria.branch && 
          transaction.branch !== this.filterCriteria.branch) {
        return false;
      }

      // Amount range filter
      if (this.filterCriteria.minAmount !== null && transaction.amount < this.filterCriteria.minAmount) {
        return false;
      }
      if (this.filterCriteria.maxAmount !== null && transaction.amount > this.filterCriteria.maxAmount) {
        return false;
      }

      // Account type filter
      if (this.filterCriteria.accountType && 
          transaction.accountId !== this.filterCriteria.accountType) {
        return false;
      }

      // Transaction type filter
      if (this.filterCriteria.transactionType && 
          transaction.type !== this.filterCriteria.transactionType) {
        return false;
      }

      // Status filter
      if (this.filterCriteria.status && 
          transaction.status !== this.filterCriteria.status) {
        return false;
      }

      return true;
    });
  }

  calculateSummary(): ReportSummary {
    const summary: ReportSummary = {
      totalTransactions: this.filteredTransactions.length,
      totalAmount: 0,
      averageAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      depositCount: 0,
      withdrawalCount: 0,
      transferCount: 0
    };

    this.filteredTransactions.forEach(transaction => {
      summary.totalAmount += transaction.amount;

      if (transaction.status === 'Completed') summary.completedCount++;
      if (transaction.status === 'Pending') summary.pendingCount++;
      if (transaction.type === 'Deposit') summary.depositCount++;
      if (transaction.type === 'Withdrawal') summary.withdrawalCount++;
      if (transaction.type === 'Transfer') summary.transferCount++;
    });

    summary.averageAmount = summary.totalTransactions > 0 
      ? summary.totalAmount / summary.totalTransactions 
      : 0;

    return summary;
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
    this.currentPage = 1;
    this.onPageChange(1);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const startIndex = (page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTransactions = this.filteredTransactions.slice(startIndex, endIndex);
  }

  resetFilters(): void {
    this.filterCriteria = {
      fromDate: '',
      toDate: '',
      month: '',
      branch: '',
      minAmount: null,
      maxAmount: null,
      accountType: '',
      transactionType: '',
      status: ''
    };
    this.generateReport();
  }

  downloadPDF(): void {
    if (this.filteredTransactions.length === 0) {
      this.errorMessage = 'No data available to download.';
      return;
    }

    const doc = this.generatePDFContent();
    const element = document.createElement('div');
    element.innerHTML = doc;
    const printWindow = window.open('', '', 'width=900,height=600');
    if (printWindow) {
      printWindow.document.write(doc);
      printWindow.document.close();
      printWindow.print();
    }
  }

  downloadAsCSV(): void {
    if (this.filteredTransactions.length === 0) {
      this.errorMessage = 'No data available to download.';
      return;
    }

    const headers = ['ID', 'Account ID', 'Customer Name', 'Type', 'Amount', 'Branch', 'Date', 'Status'];
    const rows = this.filteredTransactions.map(t => [
      t.id,
      t.accountId,
      t.customerName,
      t.type,
      this.formatCurrency(t.amount),
      t.branch,
      this.formatDate(t.date),
      t.status
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private generatePDFContent(): string {
    const date = new Date().toLocaleDateString();
    let html = `
      <html>
        <head>
          <title>Transaction Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #667eea; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #667eea; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { margin: 20px 0; }
            .summary-item { display: inline-block; margin-right: 30px; }
          </style>
        </head>
        <body>
          <h1>Transaction Report</h1>
          <p>Generated on: ${date}</p>
          
          <div class="summary">
            <div class="summary-item"><strong>Total Transactions:</strong> ${this.reportSummary.totalTransactions}</div>
            <div class="summary-item"><strong>Total Amount:</strong> ${this.formatCurrency(this.reportSummary.totalAmount)}</div>
            <div class="summary-item"><strong>Average Amount:</strong> ${this.formatCurrency(this.reportSummary.averageAmount)}</div>
            <div class="summary-item"><strong>Completed:</strong> ${this.reportSummary.completedCount}</div>
            <div class="summary-item"><strong>Pending:</strong> ${this.reportSummary.pendingCount}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Account ID</th>
                <th>Customer Name</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Branch</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${this.filteredTransactions.map(t => `
                <tr>
                  <td>${t.id}</td>
                  <td>${t.accountId}</td>
                  <td>${t.customerName}</td>
                  <td>${t.type}</td>
                  <td>${this.formatCurrency(t.amount)}</td>
                  <td>${t.branch}</td>
                  <td>${this.formatDate(t.date)}</td>
                  <td>${t.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    return html;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR' 
    }).format(amount);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}