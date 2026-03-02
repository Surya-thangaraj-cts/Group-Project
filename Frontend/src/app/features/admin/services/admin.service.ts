import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface PendingUserResponse {
  userId: string;
  name: string;
  email: string;
  branch: string;
  role: string;
  status: string;
}

export interface PaginatedUserResponse {
  items: PendingUserResponse[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ApprovalResponse {
  message: string;
  from?: string;
  to?: string;
}

export interface EditUserRequest {
  name?: string;
  email?: string;
  branch?: string;
  role?: string;
}

export interface UserResponse {
  userId: string;
  name: string;
  email: string;
  branch: string;
  role: string;
  status: string;
}

export interface EditUserResponse {
  message: string;
  user: UserResponse;
}

export interface DebugAuthResponse {
  authHeaderPresent: boolean;
  authHeaderValue: string;
  isAuthenticated: boolean;
  claims: Array<{ type: string; value: string }>;
}

export interface ComplianceMetricsResponse {
  totalTransactions: number;
  highValueCount: number;
  accountGrowthRate: number;
  monthlyTxnVolume: number[];
  monthlyLabels: string[];
  monthlySuspicious: number[];
  amountBuckets: Array<{ label: string; count: number }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  debugAuth(): Observable<DebugAuthResponse> {
    return this.http.get<DebugAuthResponse>(`${this.apiUrl}/debug-auth`)
      .pipe(catchError(this.handleError));
  }

  getPendingUsers(): Observable<PendingUserResponse[]> {
    return this.http.get<PendingUserResponse[]>(`${this.apiUrl}/pending-users`)
      .pipe(catchError(this.handleError));
  }

  getAllUsers(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedUserResponse> {
    return this.http.get<PaginatedUserResponse>(`${this.apiUrl}/approved-users`, {
      params: { page: pageNumber.toString(), pageSize: pageSize.toString() }
    }).pipe(catchError(this.handleError));
  }

  approveUser(userId: string): Observable<ApprovalResponse> {
    return this.http.put<ApprovalResponse>(`${this.apiUrl}/approve/${userId}`, {})
      .pipe(catchError(this.handleError));
  }

  deactivateUser(userId: string): Observable<ApprovalResponse> {
    return this.http.put<ApprovalResponse>(`${this.apiUrl}/deactivate/${userId}`, {})
      .pipe(catchError(this.handleError));
  }

  editUser(userId: string, request: EditUserRequest): Observable<EditUserResponse> {
    return this.http.put<EditUserResponse>(`${this.apiUrl}/edit/${userId}`, request)
      .pipe(catchError(this.handleError));
  }

  searchApprovedUsers(query: string, pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedUserResponse> {
    return this.http.get<PaginatedUserResponse>(`${this.apiUrl}/search-users`, {
      params: { 
        query: query.trim() || '',
        page: pageNumber.toString(),
        pageSize: pageSize.toString()
      }
    }).pipe(catchError(this.handleError));
  }

  searchPendingUsers(query: string): Observable<PendingUserResponse[]> {
    if (!query || query.trim() === '') {
      return this.getPendingUsers();
    }
    return this.http.get<PendingUserResponse[]>(`${this.apiUrl}/search-pending`, {
      params: { query: query.trim() }
    }).pipe(catchError(this.handleError));
  }

  getComplianceMetrics(): Observable<ComplianceMetricsResponse> {
    return this.http.get<ComplianceMetricsResponse>(`${this.apiUrl}/compliance-metrics`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Cannot connect to API. Please check if the API is running.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    } else if (error.status === 403) {
      errorMessage = 'Access denied. Admin privileges required.';
    } else if (error.status === 404) {
      errorMessage = 'User not found.';
    } else if (error.status === 409) {
      errorMessage = error.error?.message || 'Conflict - Email already in use.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Server error: ${error.status}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
