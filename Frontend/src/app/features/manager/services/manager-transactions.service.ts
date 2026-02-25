import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// In your Angular service or interface file
export interface Transaction {
  transactionId: number;  // Change from string to number
  accountId: number;
  type: string;
  amount: number;
  date: string | Date;
  status: number;
  flag: string;
  toAccountId?: number;
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
    return this.http.get<{ highValueCount: number }>(`${this.apiUrl}/high-value-count`);
  }

  exportToCSV(filters: any): void {
    let httpParams = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    window.open(`${this.apiUrl}/export/csv?${httpParams.toString()}`, '_blank');
  }

  exportToExcel(filters: any): void {
    let httpParams = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    window.open(`${this.apiUrl}/export/excel?${httpParams.toString()}`, '_blank');
  }
}
