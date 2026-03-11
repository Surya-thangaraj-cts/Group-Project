import { Component, OnInit, OnDestroy, Output, EventEmitter, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ManagerService } from '../../services/manager.service';
import { ManagerNotificationService } from '../../services/manager-notification.service';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../../../auth/auth.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() setActiveSection = new EventEmitter<string>();

  // ManagerNotificationService for notification count
  private notifService = inject(ManagerNotificationService);
  // Subject for handling unsubscription
  private destroy$ = new Subject<void>();

  // Navigation items for manager navbar
  navItems = [
    { label: 'Dashboard', icon: 'Dashboard', section: 'dashboard' },
    { label: 'Approvals', icon: 'Approvals', section: 'approvals' },
    { label: 'Reports', icon: 'Reports', section: 'reports' }
  ];

  // Tracks active navigation item
  activeNav = 'Dashboard';
  // Unread notifications count
  unreadNotificationsCount = 0;
  // Controls notification dropdown visibility
  showNotificationDropdown = false;
  // Controls profile dropdown visibility
  showProfileDropdown = false;
  // Manager profile display fields
  managerInitials = '';
  managerName = '';
  managerDesignation = '';
  managerBranch = '';

  // Inject services and router
  constructor(
    private managerService: ManagerService,
    private profileService: ProfileService,
    @Inject(AuthService) private authService: AuthService,
    private router: Router
  ) {}

  // Initialize notification count and profile data
  ngOnInit(): void {
    this.notifService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadNotificationsCount = count;
      });

    this.loadProfileData();
  }

  // Clean up subscriptions on destroy
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load manager profile data for navbar display
  loadProfileData(): void {
    this.profileService.profile$.subscribe(profile => {
      this.managerInitials = this.profileService.getInitials();
      this.managerName = `${profile.firstName} ${profile.lastName}`;
      this.managerDesignation = profile.designation;
      this.managerBranch = profile.branch;
    });
  }

  // Toggle notification dropdown visibility
  toggleNotificationDropdown(): void {
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  // Close notification dropdown
  closeNotificationDropdown(): void {
    this.showNotificationDropdown = false;
  }

  // Toggle profile dropdown visibility
  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  // Close profile dropdown
  closeProfileDropdown(): void {
    this.showProfileDropdown = false;
  }

  // View full profile and open sidebar
  viewFullProfile(): void {
    this.showProfileDropdown = false;
    this.setActiveSection.emit('openProfile');
  }

  // Logout and navigate to landing page
  logout(): void {
    this.showProfileDropdown = false;
    this.authService.signout();
    this.router.navigate(['/landing']);
  }

  // Set active navigation item and section
  setActive(item: any): void {
    this.activeNav = item.label;
    this.setActiveSection.emit(item.section);
  }

  // Navigate to dashboard section
  navigateToDashboard(): void {
    this.activeNav = 'Dashboard';
    this.setActiveSection.emit('dashboard');
  }
}