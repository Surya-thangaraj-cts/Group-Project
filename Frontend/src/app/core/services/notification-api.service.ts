import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Notification,
  UpdateNotificationStatusDto,
  NotificationType,
  NotificationStatus
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  /**
   * Get all notifications with filtering
   */
  getNotifications(type?: string, status?: string): Observable<Notification[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);

    return this.http.get<Notification[]>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get notification by ID
   */
  getNotificationById(id: number): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update notification status (mark as read/unread)
   */
  updateNotificationStatus(id: number, dto: UpdateNotificationStatusDto): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${id}/status`, dto)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete notification
   */
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete all notifications
   */
  deleteAllNotifications(): Observable<void> {
    return this.http.delete<void>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Helper: Mark notification as read
   */
  markAsRead(id: number): Observable<Notification> {
    return this.updateNotificationStatus(id, { status: 1 }); // 1 = Read
  }

  /**
   * Helper: Mark notification as unread
   */
  markAsUnread(id: number): Observable<Notification> {
    return this.updateNotificationStatus(id, { status: 0 }); // 0 = Unread
  }

  /**
   * Helper: Map NotificationType enum to string for query parameter
   */
  mapNotificationType(type: NotificationType): string {
    return type === NotificationType.ApprovalReminder ? 'ApprovalReminder' : 'SuspiciousActivity';
  }

  /**
   * Helper: Map NotificationStatus enum to string for query parameter
   */
  mapNotificationStatus(status: NotificationStatus): string {
    return status === NotificationStatus.Unread ? 'Unread' : 'Read';
  }

  /**
   * Unified error handler for API errors
   */
  private handleError(error: any): Observable<never> {
    console.error('Notification API Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
      message: error.message,
      fullError: error
    });
    
    let errorMessage = 'An error occurred while retrieving notifications.';
    
    if (error.status === 500) {
      // Extract the actual error message from the backend
      if (error.error && typeof error.error === 'string') {
        errorMessage = `Server error (500): ${error.error}`;
      } else {
        errorMessage = 'Server error (500). The backend API encountered an internal error. Check backend logs for details.';
      }
    } else if (error.status === 0) {
      errorMessage = 'Cannot connect to the backend API. Please check if the backend server is running.';
    } else if (error.error) {
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
