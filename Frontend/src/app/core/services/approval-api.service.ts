import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Approval,
  ApprovalDetailsDto,
  UpdateApprovalDto,
  PagedResult
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApprovalApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/approvals`;

  /**
   * Get all approvals with pagination and filtering
   */
  getApprovals(
    pageNumber: number = 1,
    pageSize: number = 10,
    decision?: string,
    type?: string
  ): Observable<PagedResult<Approval>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (decision) params = params.set('decision', decision);
    if (type) params = params.set('type', type);

    return this.http.get<PagedResult<Approval>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all approvals with details (includes transaction/account info)
   */
  getApprovalDetails(
    pageNumber: number = 1,
    pageSize: number = 10,
    decision?: string,
    type?: string
  ): Observable<PagedResult<ApprovalDetailsDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (decision) params = params.set('decision', decision);
    if (type) params = params.set('type', type);

    return this.http.get<PagedResult<ApprovalDetailsDto>>(`${this.apiUrl}/details`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get approval by ID
   */
  getApprovalById(id: number): Observable<Approval> {
    return this.http.get<Approval>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update approval decision (Approve/Reject)
   */
  updateApprovalDecision(id: number, dto: UpdateApprovalDto): Observable<Approval> {
    return this.http.put<Approval>(`${this.apiUrl}/${id}`, dto)
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
