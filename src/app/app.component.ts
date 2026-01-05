import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { TransactionTableComponent } from './components/transaction-table/transaction-table.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { ApprovalsComponent } from './components/approvals/approvals.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    NavbarComponent,
    DashboardOverviewComponent,
    TransactionTableComponent,
    NotificationsComponent,
    ApprovalsComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'manager';
  activeSection = 'dashboard';

  setActiveSection(section: string): void {
    this.activeSection = section;
  }
}
