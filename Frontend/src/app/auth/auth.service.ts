import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface RegisterRequest {
  userId: string;
  name: string;
  email: string;
  branch: string;
  role: string;
  password: string;
}

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface UserResponse {
  userId: string;
  name: string;
  email: string;
  branch: string;
  role: string;
  status: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface ApiResponse {
  message: string;
}

export interface User {
  name: string;
  userId?: string;
  email?: string;
  branch?: string;
  role: 'admin' | 'bankManager' | 'bankOfficer' | string;
  status?: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  avatarUrl?: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  public currentUser: User | null = null;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  register(userData: RegisterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/register`, userData)
      .pipe(catchError(this.handleError));
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem(this.tokenKey, response.token);

          const user: User = {
            userId: response.user.userId,
            name: response.user.name,
            email: response.user.email,
            branch: response.user.branch,
            role: this.normalizeRole(response.user.role),
            status: response.user.status as 'active' | 'inactive' | 'pending',
            lastLogin: new Date().toISOString(),
            password: ''
          };

          this.currentUser = user;
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }),
        catchError(this.handleError)
      );
  }

  signout(): void {
    this.currentUser = null;
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  private normalizeRole(role: string): 'admin' | 'bankManager' | 'bankOfficer' {
    const r = role.toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'bankmanager' || r === 'manager') return 'bankManager';
    return 'bankOfficer';
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Cannot connect to API. Please check if the server is running.';
    } else {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.status === 403) {
        errorMessage = 'Account not approved or inactive';
      } else if (error.status === 409) {
        errorMessage = 'UserId or Email already exists';
      } else {
        errorMessage = `Server error: ${error.status}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  private loadCurrentUser(): void {
    const stored = localStorage.getItem('currentUser');
    this.currentUser = stored ? JSON.parse(stored) : null;
    if (this.currentUser) {
      this.currentUserSubject.next(this.currentUser);
    }
  }
}