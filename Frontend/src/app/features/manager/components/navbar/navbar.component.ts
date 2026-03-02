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

  private notifService = inject(ManagerNotificationService);
  private destroy$ = new Subject<void>();

  navItems = [
    { label: 'Dashboard', icon: 'Dashboard', section: 'dashboard' },
    { label: 'Approvals', icon: 'Approvals', section: 'approvals' },
    { label: 'Reports', icon: 'Reports', section: 'reports' }
  ];

  activeNav = 'Dashboard';
  unreadNotificationsCount = 0;
  showNotificationDropdown = false;
  showProfileDropdown = false;
  
  managerInitials = '';
  managerName = '';
  managerDesignation = '';
  managerBranch = '';

  constructor(
    private managerService: ManagerService,
    private profileService: ProfileService,
    @Inject(AuthService) private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notifService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadNotificationsCount = count;
      });

    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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