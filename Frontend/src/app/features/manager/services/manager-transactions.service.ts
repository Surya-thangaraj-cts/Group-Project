// Angular service for manager transaction-related API calls
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Transaction interface represents a single transaction record
export interface Transaction {
  transactionId: string;  // Unique transaction ID
  accountId: string;      // Associated account ID
  type: string;           // Transaction type
  amount: number;         // Transaction amount
  date: string | Date;    // Date of transaction
  status: number;         // Status code
  flag: string;           // Flag for special status
  toAccountId?: string;   // Optional: destination account for transfers
}

// Generic paged result for paginated API responses
export interface PagedResult<T> {
  items: T[];             // List of items on this page
  pageNumber: number;     // Current page number
  pageSize: number;       // Number of items per page
  totalCount: number;     // Total number of items
  totalPages: number;     // Total number of pages
}

@Injectable({ providedIn: 'root' })
export class ManagerTransactionsService {
  // Base URL for manager transaction APIs
  private apiUrl = 'https://localhost:7021/api/manager-transactions';

  constructor(private http: HttpClient) {}

  // Helper to get HTTP headers with auth token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Fetch paginated transactions with optional filters.
   * Accepts filters like status, type, amount range, date range, and view mode.
   */
  getTransactions(params: {
    pageNumber?: number;
    pageSize?: number;
    searchText?: string;
    status?: string;
    type?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    viewMode?: 'all' | 'highvalue';
  }): Observable<PagedResult<Transaction>> {
    let httpParams = new HttpParams();
    // Add each filter to the HTTP params if present
    Object.keys(params).forEach(key => {
      const value = (params as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    // Make GET request to fetch transactions
    return this.http.get<PagedResult<Transaction>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get the count of high-value transactions.
   */
  getHighValueCount(): Observable<{ highValueCount: number }> {
    return this.http.get<{ highValueCount: number }>(`${this.apiUrl}/high-value-count`, {
      headers: this.getHeaders()
    });
  }

  exportToCSV(filters: any): void {
    let httpParams = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    
    this.http.get(`${this.apiUrl}/export/csv`, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => { }
    });
  }

  exportToExcel(filters: any): void {
    let httpParams = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    
    this.http.get(`${this.apiUrl}/export/excel`, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transactions-report-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => { }
    });
  }
}
