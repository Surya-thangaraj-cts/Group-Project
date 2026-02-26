import { Component, OnInit, OnDestroy, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ManagerService } from '../../services/manager.service';
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

  navItems = [
    { label: 'Dashboard', icon: 'Dashboard', section: 'dashboard' },
    { label: 'Approvals', icon: 'Approvals', section: 'approvals' },
    { label: 'Reports', icon: 'Reports', section: 'reports' }
  ];

  activeNav = 'Dashboard';
  unreadNotificationsCount: number = 0;
  private destroy$ = new Subject<void>();
  showNotificationDropdown: boolean = false;
  showProfileDropdown: boolean = false;
  
  managerInitials: string = '';
  managerName: string = '';
  managerDesignation: string = '';
  managerBranch: string = '';

  constructor(
    private managerService: ManagerService,
    private profileService: ProfileService,
    @Inject(AuthService) private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotificationsCount();
    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotificationsCount(): void {
    this.managerService.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          // Count unread (status = 0 means unread)
          this.unreadNotificationsCount = notifications.filter(n => n.status === 0).length;
        },
        error: (err) => {
          console.error('Failed to load notifications count:', err);
          this.unreadNotificationsCount = 0;
        }
      });
  }

  loadProfileData(): void {
    this.profileService.profile$.subscribe(profile => {
      this.managerInitials = this.profileService.getInitials();
      this.managerName = `${profile.firstName} ${profile.lastName}`;
      this.managerDesignation = profile.designation;
      this.managerBranch = profile.branch;
    });
  }

  toggleNotificationDropdown(): void {
    this.showNotificationDropdown = !this.showNotificationDropdown;
  }

  closeNotificationDropdown(): void {
    this.showNotificationDropdown = false;
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  closeProfileDropdown(): void {
    this.showProfileDropdown = false;
  }

  viewFullProfile(): void {
    this.showProfileDropdown = false;
    this.setActiveSection.emit('openProfile');
  }

  logout(): void {
    this.showProfileDropdown = false;
    this.authService.signout();
    this.router.navigate(['/landing']);
  }

  setActive(item: any): void {
    this.activeNav = item.label;
    this.setActiveSection.emit(item.section);
  }

  navigateToDashboard(): void {
    this.activeNav = 'Dashboard';
    this.setActiveSection.emit('dashboard');
  }
}