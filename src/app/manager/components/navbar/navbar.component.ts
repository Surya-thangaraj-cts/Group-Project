import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  @Output() setActiveSection = new EventEmitter<string>();

  navItems = [
    { label: 'Dashboard', icon: 'Dashboard', section: 'dashboard' },
    { label: 'Approvals', icon: 'Approvals', section: 'approvals' },
    { label: 'Alerts', icon: 'Alerts', section: 'alerts' }
  ];

  activeNav = 'Dashboard';
  unreadNotificationsCount: number = 0;
  showNotificationDropdown: boolean = false;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.updateNotificationCount();
  }

  updateNotificationCount(): void {
    this.unreadNotificationsCount = this.dataService.getUnreadNotificationsCount();
  }

  toggleNotificationDropdown(): void {
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  closeNotificationDropdown(): void {
    this.showNotificationDropdown = false;
  }

  setActive(item: any): void {
    this.activeNav = item.label;
    this.setActiveSection.emit(item.section);
    if (item.section === 'alerts') {
      this.closeNotificationDropdown();
    }
  }
}