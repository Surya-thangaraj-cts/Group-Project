import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReportStatistics {
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  completedCount: number;
  pendingCount: number;
  depositCount: number;
  withdrawalCount: number;
  transferCount: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  minAmount?: number | null;
  maxAmount?: number | null;
  type?: string;
  status?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = 'https://localhost:7021/api/manager-transactions';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private buildParams(filters: ReportFilters): HttpParams {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.minAmount !== null && filters.minAmount !== undefined) {
      params = params.set('minAmount', filters.minAmount.toString());
    }
    if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
      params = params.set('maxAmount', filters.maxAmount.toString());
    }
    if (filters.type) params = params.set('type', filters.type);
    if (filters.status !== null && filters.status !== undefined) {
      params = params.set('status', filters.status.toString());
    }
    return params;
  }

  getStatistics(filters: ReportFilters): Observable<ReportStatistics> {
    const params = this.buildParams(filters);
    return this.http.get<ReportStatistics>(`${this.apiUrl}/statistics`, {
      headers: this.getHeaders(),
      params
    });
  }

  exportToCSV(filters: ReportFilters): void {
    const params = this.buildParams(filters);
    window.open(`${this.apiUrl}/export/csv?${params.toString()}`, '_blank');
  }

  exportToExcel(filters: ReportFilters): void {
    const params = this.buildParams(filters);
    window.open(`${this.apiUrl}/export/excel?${params.toString()}`, '_blank');
  }
}
