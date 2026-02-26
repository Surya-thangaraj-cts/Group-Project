import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccountTypeConfig,
  CreateAccountTypeDto,
  PagedResult
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AccountTypeApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/account-types`;

  /**
   * Get all account types
   */
  getAccountTypes(includeInactive: boolean = false): Observable<AccountTypeConfig[]> {
    const params = new HttpParams()
      .set('includeInactive', includeInactive.toString());

    return this.http.get<AccountTypeConfig[]>(this.apiUrl, { params });
  }

  /**
   * Get account type by ID
   */
  getAccountTypeById(id: number): Observable<AccountTypeConfig> {
    return this.http.get<AccountTypeConfig>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new account type
   */
  createAccountType(dto: CreateAccountTypeDto): Observable<AccountTypeConfig> {
    return this.http.post<AccountTypeConfig>(this.apiUrl, dto);
  }

  /**
   * Update account type
   */
  updateAccountType(id: number, dto: Partial<CreateAccountTypeDto>): Observable<AccountTypeConfig> {
    return this.http.put<AccountTypeConfig>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete account type (soft delete - sets isActive to false)
   */
  deleteAccountType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
