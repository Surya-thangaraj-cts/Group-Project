import { Component } from '@angular/core';
// import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { TransactionTableComponent } from './components/transaction-table/transaction-table.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { ApprovalsComponent } from './components/approvals/approvals.component';

@Component({
  selector: 'app-manager',
  standalone: true,
  imports: [CommonModule,
    NavbarComponent,
    DashboardOverviewComponent,
    TransactionTableComponent,
    NotificationsComponent,
    ApprovalsComponent],
  templateUrl: './manager.component.html',
  styleUrl: './manager.component.css'
})
export class ManagerComponent {
  title = 'manager';
  activeSection = 'dashboard';

  setActiveSection(section: string): void {
    this.activeSection = section;
  }
}
