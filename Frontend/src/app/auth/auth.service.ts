import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * API Request/Response DTOs matching ASP.NET Core backend
 */
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

/**
 * User authentication model
 * Represents user data across the application
 * 
 * @interface User
 * @property {string} name - Full name of the user
 * @property {string} [userId] - Unique identifier for the user
 * @property {string} [email] - User email address
 * @property {string} [branch] - Branch/location assignment
 * @property {string} role - User role (admin, bankManager, bankOfficer)
 * @property {string} [status] - User status (active, inactive, pending)
 * @property {string} password - User password (stored in localStorage for demo)
 */
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
 
/**
 * Authentication Service
 * 
 * Manages user authentication, registration, and authorization.
 * Handles user sessions, role-based access control, and admin operations.
 * 
 * Features:
 * - User sign-in/sign-up functionality
 * - Role-based authorization (admin, bankManager, bankOfficer)
 * - User status management (active, inactive, pending)
 * - Admin approval/rejection workflows
 * - Session management with localStorage
 * 
 * @class AuthService
 * @injectable
 * @providedIn root
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private users: User[] = [];
  public currentUser: User | null = null;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
 
  constructor(private http: HttpClient) {
    this.loadUsers();
    this.addDummyUsers();
    this.loadCurrentUser();
  }
 
  /** Seed initial demo users */
  private addDummyUsers() {
    const dummyUsers: User[] = [
      {
        name: 'Admin User',
        userId: 'admin123',
        email: 'admin@example.com',
        branch: 'HQ',
        role: 'admin',
        status: 'active',
        password: 'Admin@123',
      },
      {
        name: 'Manager User',
        userId: 'manager123',
        email: 'manager@example.com',
        branch: 'Branch A',
        role: 'bankManager',
        status: 'active',
        password: 'Manager@123',
      },
      {
        name: 'Officer User',
        userId: 'officer123',
        email: 'officer@example.com',
        branch: 'Branch B',
        role: 'bankOfficer',
        status: 'active',
        password: 'Officer@123',
      },
      {
        name: 'Vikram Singh',
        userId: 'U2001',
        email: 'vikram@bank.local',
        branch: 'Bangalore',
        role: 'bankOfficer',
        status: 'pending',
        password: 'Officer@123',
      },
      {
        name: 'Sneha Kapoor',
        userId: 'U2002',
        email: 'sneha@bank.local',
        branch: 'Pune',
        role: 'bankManager',
        status: 'pending',
        password: 'Manager@123',
      },
      {
        name: 'Arjun Kumar',
        userId: 'U2003',
        email: 'arjun@bank.local',
        branch: 'Chennai',
        role: 'bankOfficer',
        status: 'pending',
        password: 'Officer@123',
      },
      {
        name: 'Divya Reddy',
        userId: 'U2004',
        email: 'divya@bank.local',
        branch: 'Hyderabad',
        role: 'admin',
        status: 'pending',
        password: 'Admin@123',
      },
      {
        name: 'Rohan Verma',
        userId: 'U2005',
        email: 'rohan@bank.local',
        branch: 'Kolkata',
        role: 'bankOfficer',
        status: 'pending',
        password: 'Officer@123',
      },
    ];

    dummyUsers.forEach(u => {
      const exists = this.users.find(x => x.userId === u.userId);
      if (!exists) this.users.push(u);
      else if (!exists.password) exists.password = u.password;
    });

    this.saveUsers();
  }  
  /**
   * Register a new user via API
   */
  register(userData: RegisterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Legacy method for backward compatibility with existing code
  signup(user: User) {
    if (!user.userId || !user.password) {
      throw new Error('userId and password required');
    }
   
    const userId = user.userId.trim();
    const email  = (user.email ?? '').trim();
   
    // CASE-INSENSITIVE duplicate checks
    const idExists = this.users.some(
      u => (u.userId ?? '').trim().toLowerCase() === userId.toLowerCase()
    );
    if (idExists) throw new Error('User ID already exists');
   
    if (email) {
      const emailExists = this.users.some(
        u => (u.email ?? '').trim().toLowerCase() === email.toLowerCase()
      );
      if (emailExists) throw new Error('Email already in use');
    }
   
    // Force all new signups to pending
    user.status = 'pending';
   
    // Normalize before persisting
    const normalized: User = { ...user, userId, email };
    this.users.push(normalized);
    this.saveUsers();
  }
 
  /**
   * Login user via API
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          // Store token
          localStorage.setItem(this.tokenKey, response.token);
          
          // Convert UserResponse to User format
          const user: User = {
            userId: response.user.userId,
            name: response.user.name,
            email: response.user.email,
            branch: response.user.branch,
            role: this.normalizeRole(response.user.role),
            status: response.user.status as 'active' | 'inactive' | 'pending',
            lastLogin: new Date().toISOString(),
            password: '' // Don't store password
          };
          
          this.currentUser = user;
          this.currentUserSubject.next(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }),
        catchError(this.handleError)
      );
  }

  /** ✅ Sign in with status check (Legacy method) */
  signin(
    userId: string,
    password: string
  ): { ok: true; user: User } | { ok: false; reason: 'invalid' | 'pending' | 'inactive' } {
   
    const found = this.users.find(u => u.userId === userId);
    if (!found) return { ok: false, reason: 'invalid' };
    if (found.status === 'pending') return { ok: false, reason: 'pending' };
    if (found.status !== 'active') return { ok: false, reason: 'inactive' };
    if (!found.password || found.password !== password) {
      return { ok: false, reason: 'invalid' };
    }
   
    found.lastLogin = new Date().toISOString();
    this.currentUser = found;
    localStorage.setItem('currentUser', JSON.stringify(found));
    return { ok: true, user: found };
  }
 
  signout() {
    this.currentUser = null;
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem(this.tokenKey);
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Normalize role from API to frontend format
   */
  private normalizeRole(role: string): 'admin' | 'bankManager' | 'bankOfficer' {
    const r = role.toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'bankmanager' || r === 'manager') return 'bankManager';
    return 'bankOfficer';
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      // Status 0 means network error or CORS issue
      errorMessage = 'Cannot connect to API. Please check:\n' +
                     '1. API is running at ' + environment.apiUrl + '\n' +
                     '2. CORS is configured in API\n' +
                     '3. API URL is correct';
      console.error('API Connection Error:', {
        url: error.url,
        message: 'Could not connect to server',
        possibleCauses: [
          'API server is not running',
          'CORS is not configured',
          'Firewall blocking connection',
          'Wrong API URL in environment.ts'
        ]
      });
    } else {
      // Server-side error
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
 
  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }
 
  getAllUsers(): User[] {
    return [...this.users];
  }
 
  // ✅ Admin helpers
  getPendingUsers(): User[] {
    return this.users.filter(u => u.status === 'pending' );
  }
 
  approveUser(userId: string) {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    user.status = 'active';
    this.saveUsers();
  }
 
  rejectUser(userId: string) {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    user.status = 'inactive';
    this.saveUsers();
   
    // If the current user is being set to inactive, log them out
    if (this.currentUser?.userId === userId) {
      this.signout();
    }
  }
 
  /** Update user status and handle logout if needed */
  updateUserStatus(userId: string, newStatus: 'active' | 'inactive' | 'pending'): void {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    user.status = newStatus;
    this.saveUsers();
   
    // If the current user is being set to inactive, log them out
    if (this.currentUser?.userId === userId && newStatus === 'inactive') {
      this.signout();
    }
  }

  updateUser(userId: string, updates: Partial<User>): void {
    const user = this.users.find(u => u.userId === userId);
    if (!user) return;
    
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.branch !== undefined) user.branch = updates.branch;
    if (updates.status !== undefined) user.status = updates.status;
    
    this.saveUsers();
    
    // If the current user is being set to inactive, log them out
    if (this.currentUser?.userId === userId && updates.status === 'inactive') {
      this.signout();
    }
  }
 
  private saveUsers() {
    localStorage.setItem('users', JSON.stringify(this.users));
  }
 
   
  private loadUsers() {
  const stored = localStorage.getItem('users');
  const arr: User[] = stored ? JSON.parse(stored) : [];
 
  // De‑duplicate by userId (trimmed, lowercased); newest wins
  const map = new Map<string, User>();
  for (const u of arr) {
    const key = (u.userId ?? '').trim().toLowerCase();
    if (!key) continue;
    map.set(key, { ...map.get(key), ...u });
  }
  this.users = Array.from(map.values());
}
 
 
  private loadCurrentUser() {
    const stored = localStorage.getItem('currentUser');
    this.currentUser = stored ? JSON.parse(stored) : null;
  }
}