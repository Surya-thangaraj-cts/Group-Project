import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuditLog,
  PagedResult
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuditApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/audit-logs`;

  /**
   * Get all audit logs with pagination and filtering
   */
  getAuditLogs(
    pageNumber: number = 1,
    pageSize: number = 10,
    action?: string,
    entityType?: string,
    userId?: number,
    fromDate?: Date,
    toDate?: Date
  ): Observable<PagedResult<AuditLog>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (action) params = params.set('action', action);
    if (entityType) params = params.set('entityType', entityType);
    if (userId) params = params.set('userId', userId.toString());
    if (fromDate) params = params.set('fromDate', fromDate.toISOString());
    if (toDate) params = params.set('toDate', toDate.toISOString());

    return this.http.get<PagedResult<AuditLog>>(this.apiUrl, { params });
  }

  /**
   * Get audit log by ID
   */
  getAuditLogById(id: number): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.apiUrl}/${id}`);
  }
}
