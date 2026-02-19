import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * Admin API DTOs matching ASP.NET Core backend
 */
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

/**
 * Compliance Metrics Response from API
 */
export interface ComplianceMetricsResponse {
  totalTransactions: number;
  highValueCount: number;
  accountGrowthRate: number;
  monthlyTxnVolume: number[];
  monthlyLabels: string[];
  monthlySuspicious: number[];
  amountBuckets: Array<{ label: string; count: number }>;
}

/**
 * Admin Service
 * 
 * Handles admin operations:
 * - Fetch pending users
 * - Approve users
 * - Deactivate users
 * - Debug authentication
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Debug authentication - Test if token is being sent correctly
   */
  debugAuth(): Observable<DebugAuthResponse> {
    return this.http.get<DebugAuthResponse>(`${this.apiUrl}/debug-auth`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all pending users awaiting approval
   */
  getPendingUsers(): Observable<PendingUserResponse[]> {
    return this.http.get<PendingUserResponse[]>(`${this.apiUrl}/pending-users`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all approved users (Active status only) with pagination
   */
  getAllUsers(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedUserResponse> {
    return this.http.get<PaginatedUserResponse>(`${this.apiUrl}/approved-users`, {
      params: { pageNumber: pageNumber.toString(), pageSize: pageSize.toString() }
    }).pipe(catchError(this.handleError));
  }

  /**
   * Approve a pending user (set status to Active)
   */
  approveUser(userId: string): Observable<ApprovalResponse> {
    return this.http.put<ApprovalResponse>(`${this.apiUrl}/approve/${userId}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Deactivate a user (set status to Inactive)
   */
  deactivateUser(userId: string): Observable<ApprovalResponse> {
    return this.http.put<ApprovalResponse>(`${this.apiUrl}/deactivate/${userId}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Edit an existing user's details
   */
  editUser(userId: string, request: EditUserRequest): Observable<EditUserResponse> {
    return this.http.put<EditUserResponse>(`${this.apiUrl}/edit/${userId}`, request)
      .pipe(catchError(this.handleError));
  }

  /**
   * Search approved users by query string
   */
  searchApprovedUsers(query: string): Observable<PendingUserResponse[]> {
    if (!query || query.trim() === '') {
      // For empty query, get all users from first page and extract items
      return this.getAllUsers(1, 10000).pipe(
        map(response => response.items)
      );
    }
    return this.http.get<PendingUserResponse[]>(`${this.apiUrl}/search-users`, {
      params: { query: query.trim() }
    }).pipe(catchError(this.handleError));
  }

  /**
   * Search pending users by query string
   */
  searchPendingUsers(query: string): Observable<PendingUserResponse[]> {
    if (!query || query.trim() === '') {
      return this.getPendingUsers();
    }
    return this.http.get<PendingUserResponse[]>(`${this.apiUrl}/search-pending`, {
      params: { query: query.trim() }
    }).pipe(catchError(this.handleError));
  }

  /**
   * Get compliance metrics from API
   */
  getComplianceMetrics(): Observable<ComplianceMetricsResponse> {
    return this.http.get<ComplianceMetricsResponse>(`${this.apiUrl}/compliance-metrics`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
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
    
    console.error('Admin API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
