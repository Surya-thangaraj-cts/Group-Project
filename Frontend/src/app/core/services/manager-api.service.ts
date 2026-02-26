import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ManagerDashboard,
  ApprovalDetailsDto,
  Transaction,
  PagedResult
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ManagerApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/manager`;

  /**
   * Get manager dashboard summary
   */
  getDashboard(): Observable<ManagerDashboard> {
    return this.http.get<ManagerDashboard>(`${this.apiUrl}/dashboard`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<PagedResult<ApprovalDetailsDto>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PagedResult<ApprovalDetailsDto>>(`${this.apiUrl}/pending-approvals`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get suspicious transactions
   */
  getSuspiciousTransactions(
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<any> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get(`${this.apiUrl}/suspicious-transactions`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get high-value transactions
   */
  getHighValueTransactions(
    pageNumber: number = 1,
    pageSize: number = 10,
    minAmount: number = 100000
  ): Observable<any> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('minAmount', minAmount.toString());

    return this.http.get(`${this.apiUrl}/high-value-transactions`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get my approvals (assigned to logged-in manager)
   */
  getMyApprovals(
    pageNumber: number = 1,
    pageSize: number = 10,
    decision?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (decision) params = params.set('decision', decision);

    return this.http.get(`${this.apiUrl}/my-approvals`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Unified error handler for API errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.title) {
        errorMessage = error.error.title;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
