import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService, Notification } from '../../services/data.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  private notificationsSub?: any;
  private unreadCountSub?: any;

  constructor(private dataService: DataService, private router: Router) {}
  handleNotificationClick(notification: Notification): void {
    this.dataService.markNotificationAsRead(notification.notificationId);
    // Extract transaction or change ID from the message
    const txnMatch = notification.message.match(/TXN\d+/);
    const changeMatch = notification.message.match(/DCH\d+/);
    const accountMatch = notification.message.match(/ACC\d+/);
    if (txnMatch) {
      setTimeout(() => {
        this.router.navigate(['/manager'], {
          fragment: 'approvals',
          queryParams: { transactionId: txnMatch[0] }
        });
      }, 100);
    } else if (changeMatch) {
      setTimeout(() => {
        this.router.navigate(['/manager'], {
          fragment: 'approvals',
          queryParams: { changeId: changeMatch[0] }
        });
      }, 100);
    } else if (accountMatch) {
      setTimeout(() => {
        this.router.navigate(['/manager'], {
          fragment: 'approvals',
          queryParams: { accountId: accountMatch[0] }
        });
      }, 100);
    } else {
      setTimeout(() => {
        this.router.navigate(['/manager'], { fragment: 'approvals' });
      }, 100);
    }
  }

  ngOnInit(): void {
    this.notificationsSub = this.dataService.getNotifications().subscribe(data => {
      this.notifications = data;
    });
    this.unreadCountSub = this.dataService.getUnreadNotificationsCount().subscribe(count => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy(): void {
    if (this.notificationsSub) this.notificationsSub.unsubscribe();
    if (this.unreadCountSub) this.unreadCountSub.unsubscribe();
  }

  // loadNotifications and updateUnreadCount removed, now handled by subscriptions

  markAsRead(notificationId: string): void {
    this.dataService.markNotificationAsRead(notificationId);
  }

  deleteNotification(notificationId: string): void {
    this.dataService.deleteNotification(notificationId);
  }

  getNotificationIcon(type: 'ApprovalReminder' | 'SuspiciousActivity'): string {
    return type === 'SuspiciousActivity' ? '⚠️' : '📋';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}