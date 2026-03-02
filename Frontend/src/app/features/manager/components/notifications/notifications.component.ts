import { Component, OnInit, OnDestroy, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerNotificationService, ManagerNotification } from '../../services/manager-notification.service';
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

  private notifService = inject(ManagerNotificationService);
  private destroy$ = new Subject<void>();

  notifications: ManagerNotification[] = [];
  unreadCount = 0;
  showDetailModal = false;
  selectedNotification: ManagerNotification | null = null;

  ngOnInit(): void {
    this.notifService.refresh();

    this.notifService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.notifications = data;
        this.unreadCount = data.filter(n => n.status === 0).length;

        if (this.selectedNotification) {
          const updated = data.find(n => n.notificationId === this.selectedNotification!.notificationId);
          if (updated) this.selectedNotification = updated;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleNotificationClick(notification: ManagerNotification): void {
    if (notification.status === 0) this.notifService.markAsRead(notification);
    this.selectedNotification = notification;
    this.showDetailModal = true;
  }

  onDelete(notification: ManagerNotification, event: Event): void {
    event.stopPropagation();
    this.notifService.deleteNotification(notification);
  }

  onDeleteFromModal(): void {
    if (this.selectedNotification) {
      this.notifService.deleteNotification(this.selectedNotification);
      this.closeDetailModal();
    }
  }

  onMarkAllRead(): void { this.notifService.markAllAsRead(); }
  onClearAll(): void { this.notifService.clearAll(); }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedNotification = null;
  }

  closeDropdown(): void { this.close.emit(); }

  isUnread(n: ManagerNotification): boolean { return n.status === 0; }

  getNotificationTypeLabel(type: number): string {
    switch (type) {
      case 0: return 'Account Request';
      case 1: return 'Approval Reminder';
      case 2: return 'Transaction Alert';
      case 3: return 'System Alert';
      default: return 'Notification';
    }
  }

  getNotificationIcon(n: ManagerNotification): string {
    if (n._fromApproval) {
      switch (n._approvalType) {
        case 'AccountCreation': return '👤';
        case 'AccountUpdate': return '📝';
        case 'Transaction': return '💰';
        default: return '📋';
      }
    }
    switch (n.type) {
      case 0: return '👤';
      case 1: return '📋';
      case 2: return '💰';
      case 3: return '⚠️';
      default: return '🔔';
    }
  }

  getApprovalTypeLabel(n: ManagerNotification): string {
    if (!n._fromApproval) return '';
    switch (n._approvalType) {
      case 'AccountCreation': return 'New Account Request';
      case 'AccountUpdate': return 'Account Update Request';
      case 'Transaction': return 'Transaction Approval';
      default: return 'Pending Approval';
    }
  }

  getNotificationDescription(n: ManagerNotification): string {
    if (n.message && n.message.length > 60) return n.message.substring(0, 60) + '...';
    return n.message || this.getNotificationTypeLabel(n.type);
  }

  getStatusLabel(status: number): string { return status === 0 ? 'Unread' : 'Read'; }

  getPendingChangesEntries(n: ManagerNotification): { label: string; value: string }[] {
    const raw = n._pendingChanges;
    if (!raw) return [];

    if (raw.includes(':') && !raw.startsWith('{')) {
      return raw.split('\n').filter((l: string) => l.trim()).map((line: string) => {
        const idx = line.indexOf(':');
        return { label: line.substring(0, idx).trim(), value: line.substring(idx + 1).trim() };
      });
    }

    try {
      const obj = JSON.parse(raw);
      return Object.entries(obj).map(([key, val]) => ({
        label: key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase()),
        value: String(val)
      }));
    } catch {
      return [{ label: 'Details', value: raw }];
    }
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const then = new Date(dateStr).getTime();
    if (isNaN(then)) return '';
    const diffSec = Math.floor((Date.now() - then) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}