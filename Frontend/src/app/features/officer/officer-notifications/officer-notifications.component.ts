import { Component, OnInit, OnDestroy, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfficerService } from '../officer.service';
import { Notification } from '../model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'officer-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './officer-notifications.component.html',
  styleUrls: ['./officer-notifications.component.css']
})
export class OfficerNotificationsComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  private officerSvc = inject(OfficerService);
  
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showDetailModal: boolean = false;
  selectedNotification: Notification | null = null;
  detailData: any = {};

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.officerSvc.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.notifications = Array.isArray(data) 
          ? data.sort((a, b) => {
              const timeA = a.timestamp || a.time || '';
              const timeB = b.timestamp || b.time || '';
              return new Date(timeB).getTime() - new Date(timeA).getTime();
            })
          : [];
        this.unreadCount = this.notifications.filter(n => !n.read).length;
      });

    this.officerSvc.checkApprovalUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleNotificationClick(notification: Notification): void {
    this.officerSvc.markAsRead(notification.id);
    this.selectedNotification = notification;

    // Extract details from notification
    if (notification.type === 'ACCOUNT_CREATION') {
      this.detailData = {
        type: 'account_creation',
        notification: notification,
        accountId: notification.meta?.accountId,
        approvalId: notification.meta?.approvalId,
        customerName: notification.meta?.customerName,
        customerId: notification.meta?.customerId,
        accountType: notification.meta?.accountType,
        status: notification.meta?.status || 'Pending',
        decision: notification.meta?.decision,
        comments: notification.meta?.comments,
        message: notification.message
      };
    } else if (notification.type === 'UPDATE_REQUEST') {
      this.detailData = {
        type: 'update_request',
        notification: notification,
        accountId: notification.meta?.accountId,
        updateId: notification.meta?.updateId,
        changes: notification.meta?.changes,
        status: notification.meta?.status || 'Pending',
        decision: notification.meta?.decision,
        comments: notification.meta?.comments,
        message: notification.message
      };
    } else if (notification.type === 'TRANSACTION') {
      this.detailData = {
        type: 'transaction',
        notification: notification,
        accountId: notification.meta?.accountId,
        txnId: notification.meta?.txnId,
        amount: notification.meta?.amount,
        transactionType: notification.meta?.type,
        toAccountId: notification.meta?.toAccountId,
        approvalId: notification.meta?.approvalId,
        status: notification.meta?.status || 'Pending',
        decision: notification.meta?.decision,
        comments: notification.meta?.comments,
        message: notification.message
      };
    } else {
      this.detailData = {
        type: 'general',
        notification: notification,
        message: notification.message
      };
    }

    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedNotification = null;
    this.detailData = {};
  }

  closeDropdown(): void {
    this.close.emit();
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.officerSvc.deleteNotification(id);
  }

  onDeleteFromModal(): void {
    if (this.selectedNotification) {
      this.officerSvc.deleteNotification(this.selectedNotification.id);
      this.closeDetailModal();
    }
  }

  onClearAll(): void {
    this.officerSvc.clearAllNotifications();
  }

  onMarkAllRead(): void {
    this.officerSvc.markAllAsRead();
  }

  getNotificationDescription(notification: Notification): string {
    if (notification.meta?.decision) {
      const decision = notification.meta.decision.toLowerCase();
      if (decision === 'approved') {
        if (notification.type === 'ACCOUNT_CREATION') {
          return 'Account creation request approved';
        } else if (notification.type === 'UPDATE_REQUEST') {
          return 'Account update request approved';
        } else if (notification.type === 'TRANSACTION') {
          return 'Transaction approved';
        }
      } else if (decision === 'rejected') {
        if (notification.type === 'ACCOUNT_CREATION') {
          return 'Account creation request rejected';
        } else if (notification.type === 'UPDATE_REQUEST') {
          return 'Account update request rejected';
        } else if (notification.type === 'TRANSACTION') {
          return 'Transaction rejected';
        }
      }
    }

    if (notification.type === 'ACCOUNT_CREATION') {
      return 'Account creation request submitted';
    } else if (notification.type === 'UPDATE_REQUEST') {
      return 'Account update request submitted';
    } else if (notification.type === 'TRANSACTION') {
      return 'Transaction pending approval';
    }
    return notification.title || 'Notification';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  timeAgo(dateStr: string | Date | undefined): string {
    if (!dateStr) return '';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    if (isNaN(then)) return '';
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 0) return 'Just now';
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  getStatusClass(type: string, meta?: any): string {
    if (meta?.decision === 'Approved') return 'status-approved';
    if (meta?.decision === 'Rejected') return 'status-rejected';
    if (type === 'UPDATE_REQUEST') return 'status-pending';
    if (type === 'TRANSACTION') return 'status-pending';
    if (type === 'ACCOUNT_CREATION') return 'status-pending';
    return '';
  }
}
