import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Notification } from '../../services/data.service';
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

  notifications: Notification[] = [];
  unreadCount: number = 0;
  showDetailModal: boolean = false;
  selectedNotification: Notification | null = null;
  detailData: any = {};

  private destroy$ = new Subject<void>();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.notifications = data.sort((a, b) => 
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );
      });

    this.dataService.getUnreadNotificationsCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Opens detail modal instantly with relevant data
   */
  handleNotificationClick(notification: Notification): void {
    this.dataService.markNotificationAsRead(notification.notificationId);
    this.selectedNotification = notification;

    // Extract details from notification message
    const details = this.dataService.extractNotificationDetailsFromMessage(notification.message);

    // Fetch relevant data based on notification type
    if (details.type === 'transaction') {
      const transaction = this.dataService.getTransactionById(details.value);
      const approval = this.dataService.getApprovalByTransactionId(details.value);
      this.detailData = {
        type: 'transaction',
        transaction,
        approval
      };
    } else if (details.type === 'datachange') {
      const dataChange = this.dataService.getDataChangeApprovalByChangeId(details.value);
      this.detailData = {
        type: 'datachange',
        dataChange
      };
    } else {
      // Suspicious activity - just show the notification message
      this.detailData = {
        type: 'suspicious',
        accountId: details.value
      };
    }

    this.showDetailModal = true;
  }

  /**
   * Closes the detail modal
   */
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedNotification = null;
    this.detailData = {};
  }

  /**
   * Gets a short description for dropdown display
   */
  getNotificationDescription(notification: Notification): string {
    if (notification.type === 'SuspiciousActivity') {
      if (notification.message.toLowerCase().includes('high-value')) {
        return 'High-value transaction';
      }
      if (notification.message.toLowerCase().includes('unusual')) {
        return 'Unusual pattern detected';
      }
      return 'Suspicious activity';
    } else if (notification.type === 'ApprovalReminder') {
      const amountMatch = notification.message.match(/₹[\d,]+/);
      if (amountMatch) {
        return `Pending: ${amountMatch[0]}`;
      }
      return 'Pending approval';
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
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  closeDropdown(): void {
    this.close.emit();
  }
}