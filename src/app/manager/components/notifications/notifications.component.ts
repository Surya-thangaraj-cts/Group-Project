import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
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
  private destroy$ = new Subject<void>();

  constructor(private dataService: DataService, private router: Router) {}

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

  handleNotificationClick(notification: Notification): void {
    this.dataService.markNotificationAsRead(notification.notificationId);
    const navigationId = this.extractNavigationId(notification.message);
    
    this.closeDropdown();
    setTimeout(() => {
      if (navigationId.key && navigationId.value) {
        this.router.navigate(['/manager'], {
          fragment: 'approvals',
          queryParams: { [navigationId.key]: navigationId.value }
        });
      } else {
        this.router.navigate(['/manager'], { fragment: 'approvals' });
      }
    }, 100);
  }

  private extractNavigationId(message: string): { key: string; value: string } {
    const patterns = [
      { regex: /TXN\d+/, key: 'transactionId' },
      { regex: /DCH\d+/, key: 'changeId' },
      { regex: /ACC\d+/, key: 'accountId' }
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern.regex);
      if (match) {
        return { key: pattern.key, value: match[0] };
      }
    }

    return { key: '', value: '' };
  }

  getNotificationDescription(notification: Notification): string {
    if (notification.type === 'SuspiciousActivity') {
      return this.describeSuspiciousActivity(notification.message);
    } else if (notification.type === 'ApprovalReminder') {
      return this.describeApprovalReminder(notification.message);
    }
    return notification.message;
  }

  private describeSuspiciousActivity(message: string): string {
    if (message.toLowerCase().includes('high-value')) {
      return 'High-value transaction suspicious';
    }
    if (message.toLowerCase().includes('unusual')) {
      return 'Unusual transaction detected';
    }
    if (message.toLowerCase().includes('multiple')) {
      return 'Multiple rapid transactions';
    }
    return 'Suspicious activity detected';
  }

  private describeApprovalReminder(message: string): string {
    const amountMatch = message.match(/₹[\d,]+/);
    if (amountMatch) {
      return `Pending approval: ${amountMatch[0]}`;
    }
    return 'Approval reminder - pending approvals';
  }

  closeDropdown(): void {
    this.close.emit();
  }
}