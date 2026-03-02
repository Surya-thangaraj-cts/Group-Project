import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Account,
  AccountDto,
  CreateAccountDto,
  UpdateAccountDto,
  AccountOperationResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/accounts`;

  getAccounts(
    pageNumber: number = 1,
    pageSize: number = 10,
    status?: number
  ): Observable<AccountDto[]> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }

    return this.http.get<AccountDto[]>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  getAccountById(id: string): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createAccount(dto: CreateAccountDto): Observable<AccountOperationResponse> {
    return this.http.post<AccountOperationResponse>(this.apiUrl, dto)
      .pipe(catchError(this.handleError));
  }

  updateAccount(id: string, dto: UpdateAccountDto): Observable<AccountOperationResponse> {
    return this.http.put<AccountOperationResponse>(`${this.apiUrl}/${id}`, dto)
      .pipe(catchError(this.handleError));
  }

  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred while processing your request.';

    if (error.status === 500) {
      errorMessage = 'Server error (500). Please check if the backend API is running correctly.';
      if (error.error?.details) errorMessage += ' Details: ' + error.error.details;
    } else if (error.status === 409) {
      errorMessage = error.error?.error || 'Account ID already exists.';
    } else if (error.status === 400) {
      if (error.error?.errors) {
        errorMessage = Object.values(error.error.errors).flat().join(' ');
      } else if (error.error?.title) {
        errorMessage = error.error.title;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      }
    } else if (error.status === 0) {
      errorMessage = 'Cannot connect to the backend API.';
    } else if (error.error) {
      if (typeof error.error === 'string') errorMessage = error.error;
      else if (error.error.error) errorMessage = error.error.error;
      else if (error.error.title) errorMessage = error.error.title;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
