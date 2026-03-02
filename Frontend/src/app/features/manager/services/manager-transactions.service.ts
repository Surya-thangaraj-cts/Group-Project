import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// In your Angular service or interface file
export interface Transaction {
  transactionId: string;  // e.g. "TXN1234"
  accountId: string;      // e.g. "ACC1234"
  type: string;
  amount: number;
  date: string | Date;
  status: number;
  flag: string;
  toAccountId?: string;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ManagerTransactionsService {
  private apiUrl = 'https://localhost:7021/api/manager-transactions';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

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
    Object.keys(params).forEach(key => {
      const value = (params as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<PagedResult<Transaction>>(this.apiUrl, { params: httpParams });
  }

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
