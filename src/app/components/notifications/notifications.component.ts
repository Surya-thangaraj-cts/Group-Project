import { Component, OnInit } from '@angular/core';
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

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.dataService.getNotifications().subscribe((data: Notification[]) => {
      this.notifications = data;
      this.updateUnreadCount();
    });
  }

  updateUnreadCount(): void {
    this.unreadCount = this.dataService.getUnreadNotificationsCount();
  }

  markAsRead(notificationId: string): void {
    this.dataService.markNotificationAsRead(notificationId);
    this.updateUnreadCount();
    this.loadNotifications();
  }

  deleteNotification(notificationId: string): void {
    this.dataService.deleteNotification(notificationId);
    this.loadNotifications();
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
