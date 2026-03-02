import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Transaction,
  CreateTransactionDto,
  TransactionDto,
  PagedResult,
  TransactionCreationResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TransactionApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transactions`;

  getTransactions(
    pageNumber: number = 1,
    pageSize: number = 10,
    accountId?: string,
    type?: string,
    status?: string,
    flag?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<PagedResult<TransactionDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (accountId) params = params.set('accountId', accountId.toString());
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);
    if (flag) params = params.set('flag', flag);
    if (fromDate) params = params.set('fromDate', fromDate.toISOString());
    if (toDate) params = params.set('toDate', toDate.toISOString());

    return this.http.get<PagedResult<TransactionDto>>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createTransaction(dto: CreateTransactionDto): Observable<TransactionCreationResponse> {
    return this.http.post<TransactionCreationResponse>(this.apiUrl, dto)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred while retrieving transactions.';

    if (error.status === 500) {
      errorMessage = 'Server error (500). Please check if the backend API is running correctly.';
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
