import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../../auth/auth.service';

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
  showProfileDropdown: boolean = false;
  
  managerInitials: string = '';
  managerName: string = '';
  managerDesignation: string = '';
  managerBranch: string = '';

  constructor(
    private dataService: DataService,
    private profileService: ProfileService,
    @Inject(AuthService) private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateNotificationCount();
    this.loadProfileData();
  }

  updateNotificationCount(): void {
    this.unreadNotificationsCount = this.dataService.getUnreadNotificationsCount();
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
    this.authService.logout();
    this.router.navigate(['/landing']);
  }

  setActive(item: any): void {
    this.activeNav = item.label;
    this.setActiveSection.emit(item.section);
    if (item.section === 'alerts') {
      this.closeNotificationDropdown();
    }
  }

  navigateToDashboard(): void {
    this.activeNav = 'Dashboard';
    this.setActiveSection.emit('dashboard');
  }
}