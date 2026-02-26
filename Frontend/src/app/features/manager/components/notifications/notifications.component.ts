import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerService } from '../../services/manager.service';
import { NotificationDto } from '../../services/manager-dtos';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() unreadCountChanged = new EventEmitter<number>();

  notifications: NotificationDto[] = [];
  unreadCount: number = 0;
  showDetailModal: boolean = false;
  selectedNotification: NotificationDto | null = null;

  private destroy$ = new Subject<void>();

  constructor(private managerService: ManagerService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.managerService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.notifications = data.sort((a, b) => 
            new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
          );
          // Count unread (status = 0 means unread)
          this.unreadCount = this.notifications.filter(n => n.status === 0).length;
          this.unreadCountChanged.emit(this.unreadCount);
        },
        error: (err) => {
          console.error('Failed to load notifications:', err);
        }
      });
  }

  /**
   * Opens detail modal with notification data
   */
  handleNotificationClick(notification: NotificationDto): void {
    // Mark as read if unread (status = 0)
    if (notification.status === 0) {
      this.managerService.markNotificationAsRead(notification.notificationId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            notification.status = 1; // Update local state
            this.unreadCount = this.notifications.filter(n => n.status === 0).length;
            this.unreadCountChanged.emit(this.unreadCount);
          },
          error: (err) => {
            console.error('Failed to mark notification as read:', err);
          }
        });
    }
    
    this.selectedNotification = notification;
    this.showDetailModal = true;
  }

  /**
   * Closes the detail modal
   */
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedNotification = null;
  }

  /**
   * Deletes a notification
   */
  deleteNotification(notification: NotificationDto, event: Event): void {
    event.stopPropagation();
    this.managerService.deleteNotification(notification.notificationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.notificationId !== notification.notificationId);
          this.unreadCount = this.notifications.filter(n => n.status === 0).length;
          this.unreadCountChanged.emit(this.unreadCount);
        },
        error: (err) => {
          console.error('Failed to delete notification:', err);
        }
      });
  }

  /**
   * Gets notification type label
   */
  getNotificationTypeLabel(type: number): string {
    // Type mapping: 0=SuspiciousActivity, 1=ApprovalReminder, etc.
    switch (type) {
      case 0: return 'Suspicious Activity';
      case 1: return 'Approval Reminder';
      case 2: return 'System Alert';
      default: return 'Notification';
    }
  }

  /**
   * Gets a short description for dropdown display
   */
  getNotificationDescription(notification: NotificationDto): string {
    const typeLabel = this.getNotificationTypeLabel(notification.type);
    if (notification.message.length > 50) {
      return notification.message.substring(0, 50) + '...';
    }
    return notification.message;
  }

  /**
   * Formats currency for display
   */
  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }

  /**
   * Formats date for display
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Gets status label
   */
  getStatusLabel(status: number): string {
    return status === 0 ? 'Unread' : 'Read';
  }

  /**
   * Checks if notification is unread
   */
  isUnread(notification: NotificationDto): boolean {
    return notification.status === 0;
  }

  closeDropdown(): void {
    this.close.emit();
  }
}