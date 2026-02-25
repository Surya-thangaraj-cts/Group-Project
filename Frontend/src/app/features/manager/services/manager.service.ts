import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PagedApprovals,
  ApprovalDto,
  PagedApprovalDetails,
  ApprovalDetailsDto,
  PagedTransactions,
  TransactionDto,
  AccountDto,
  ComplianceMetricsDto,
  NotificationDto,
  AmountBucketDto,
  ManagerDashboardOverviewDto
} from './manager-dtos';

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // MANAGER DASHBOARD OVERVIEW
  getManagerDashboardOverview(): Observable<ManagerDashboardOverviewDto> {
    return this.http.get<ManagerDashboardOverviewDto>(`${this.apiUrl}/manager-dashboard/overview`, {
      headers: this.getHeaders()
    });
  }

  // APPROVALS
  getApprovals(pageNumber: number = 1, pageSize: number = 10, decision?: string, type?: string): Observable<PagedApprovals> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (decision) params = params.set('decision', decision);
    if (type) params = params.set('type', type);
    return this.http.get<PagedApprovals>(`${this.apiUrl}/approvals`, {
      headers: this.getHeaders(),
      params
    });
  }

  getApprovalDetails(pageNumber: number = 1, pageSize: number = 10, decision?: string, type?: string): Observable<PagedApprovalDetails> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (decision) params = params.set('decision', decision);
    if (type) params = params.set('type', type);
    return this.http.get<PagedApprovalDetails>(`${this.apiUrl}/approvals/details`, {
      headers: this.getHeaders(),
      params
    });
  }

  getApprovalById(id: number): Observable<ApprovalDto> {
    return this.http.get<ApprovalDto>(`${this.apiUrl}/approvals/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateApprovalDecision(id: number, decision: number, comments: string): Observable<ApprovalDto> {
    const body = { decision, comments };
    return this.http.put<ApprovalDto>(`${this.apiUrl}/approvals/${id}`, body, {
      headers: this.getHeaders()
    });
  }

  // TRANSACTIONS
  getTransactions(
    pageNumber: number = 1,
    pageSize: number = 10,
    accountId?: number,
    type?: string,
    status?: string,
    flag?: string,
    fromDate?: string,
    toDate?: string
  ): Observable<PagedTransactions> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (accountId) params = params.set('accountId', accountId.toString());
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);
    if (flag) params = params.set('flag', flag);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<PagedTransactions>(`${this.apiUrl}/transactions`, {
      headers: this.getHeaders(),
      params
    });
  }

  getTransactionById(id: number): Observable<TransactionDto> {
    return this.http.get<TransactionDto>(`${this.apiUrl}/transactions/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ACCOUNTS
  getAccounts(pageNumber: number = 1, pageSize: number = 10, status?: number): Observable<AccountDto[]> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (status !== undefined) params = params.set('status', status.toString());
    return this.http.get<AccountDto[]>(`${this.apiUrl}/accounts`, {
      headers: this.getHeaders(),
      params
    });
  }

  getAccountById(id: number): Observable<AccountDto> {
    return this.http.get<AccountDto>(`${this.apiUrl}/accounts/${id}`, {
      headers: this.getHeaders()
    });
  }

  // COMPLIANCE METRICS
  getComplianceMetrics(): Observable<ComplianceMetricsDto> {
    return this.http.get<ComplianceMetricsDto>(`${this.apiUrl}/manager/compliance-metrics`, {
      headers: this.getHeaders()
    });
  }

  // NOTIFICATIONS
  getNotifications(type?: string, status?: string): Observable<NotificationDto[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);
    return this.http.get<NotificationDto[]>(`${this.apiUrl}/notifications`, {
      headers: this.getHeaders(),
      params
    });
  }

  markNotificationAsRead(id: number): Observable<NotificationDto> {
    const body = { status: 1 };
    return this.http.put<NotificationDto>(`${this.apiUrl}/notifications/${id}/status`, body, {
      headers: this.getHeaders()
    });
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notifications/${id}`, {
      headers: this.getHeaders()
    });
  }
}
