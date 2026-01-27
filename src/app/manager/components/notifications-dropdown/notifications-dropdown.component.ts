import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DataService, Notification } from '../../services/data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-dropdown.component.html',
  styleUrls: ['./notifications-dropdown.component.css']
})
export class NotificationsDropdownComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  notifications: Notification[] = [];
  unreadNotificationsCount: number = 0;
  private destroy$ = new Subject<void>();
  private notificationsSub?: any;
  private unreadCountSub?: any;

  constructor(
    private dataService: DataService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.notificationsSub = this.dataService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications.sort((a, b) => 
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );
      });
    this.unreadCountSub = this.dataService.getUnreadNotificationsCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadNotificationsCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.notificationsSub) this.notificationsSub.unsubscribe();
    if (this.unreadCountSub) this.unreadCountSub.unsubscribe();
  }

  // loadNotifications and updateUnreadCount removed, now handled by subscriptions

  getNotificationBadgeCount(): string {
    if (this.unreadNotificationsCount > 9) {
      return '9+';
    }
    return this.unreadNotificationsCount.toString();
  }

  getNotificationDescription(notification: Notification): string {
    if (notification.type === 'SuspiciousActivity') {
      if (notification.message.toLowerCase().includes('high-value')) {
        return 'High-value transaction suspicious';
      }
      if (notification.message.toLowerCase().includes('unusual')) {
        return 'Unusual transaction detected';
      }
      if (notification.message.toLowerCase().includes('multiple')) {
        return 'Multiple rapid transactions';
      }
      return 'Suspicious activity detected';
    } else if (notification.type === 'ApprovalReminder') {
      const amountMatch = notification.message.match(/\$[\d,]+/);
      if (amountMatch) {
        return `Pending approval: ${amountMatch[0]}`;
      }
      return 'Approval reminder - pending approvals';
    }
    return notification.message;
  }

  handleNotificationClick(notification: Notification): void {
    // Mark as read
    this.dataService.markNotificationAsRead(notification.notificationId);

    // Extract transaction or change ID from the message
    const txnMatch = notification.message.match(/TXN\d+/);
    const changeMatch = notification.message.match(/DCH\d+/);
    const accountMatch = notification.message.match(/ACC\d+/);
    
    // Emit navigation event with the extracted ID
    if (txnMatch) {
      this.close.emit();
      // Delay to ensure dropdown closes first
      setTimeout(() => {
        this.router.navigate(['/manager'], { 
          fragment: 'approvals',
          queryParams: { transactionId: txnMatch[0] }
        });
      }, 100);
    } else if (changeMatch) {
      this.close.emit();
      setTimeout(() => {
        this.router.navigate(['/manager'], { 
          fragment: 'approvals',
          queryParams: { changeId: changeMatch[0] }
        });
      }, 100);
    } else if (accountMatch) {
      this.close.emit();
      setTimeout(() => {
        this.router.navigate(['/manager'], { 
          fragment: 'approvals',
          queryParams: { accountId: accountMatch[0] }
        });
      }, 100);
    } else {
      this.close.emit();
      setTimeout(() => {
        this.router.navigate(['/manager'], { fragment: 'approvals' });
      }, 100);
    }
  }

  closeDropdown(): void {
    this.close.emit();
  }
}
