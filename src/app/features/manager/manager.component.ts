import { Component, OnInit } from '@angular/core';
// import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { TransactionTableComponent } from './components/transaction-table/transaction-table.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { ApprovalsComponent } from './components/approvals/approvals.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ReportsComponent } from './components/reports/reports.component';
import { ProfileService } from './services/profile.service';

/**
 * Manager Dashboard Component
 * 
 * Central hub for bank managers to monitor transactions, approvals, and reports.
 * Provides navigation between dashboard, approvals, and reports views.
 * 
 * Features:
 * - Transaction oversight
 * - Pending approval management
 * - Financial reporting
 * - Notifications and alerts
 * - Profile management
 * 
 * @component
 * @standalone
 * @selector app-manager
 */
@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CommonModule,
    NavbarComponent,
    DashboardOverviewComponent,
    TransactionTableComponent,
    NotificationsComponent,
    ApprovalsComponent,
    ProfileComponent,
    ReportsComponent],
  templateUrl: './manager.component.html',
  styleUrl: './manager.component.css'
})
export class ManagerComponent implements OnInit {
  title = 'manager';
  activeSection = 'dashboard';
  showProfileSidebar = false;
  managerProfile: any = {};

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    // Refresh profile to load current logged-in user data
    this.profileService.refreshProfile();
    this.fetchManagerProfile();
  }

  async fetchManagerProfile() {
    this.profileService.profile$.subscribe(profile => {
      this.managerProfile = profile;
    });
  }

  handleNavigation(section: string): void {
    if (section === 'openProfile') {
      this.showProfileSidebar = true;
    } else {
      this.activeSection = section;
    }
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  openProfileSidebar(): void {
    this.showProfileSidebar = true;
  }
}

