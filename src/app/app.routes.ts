import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { AdminComponent } from './admin/admin.component';
import { ManagerComponent } from './manager/manager.component';
import { ApprovalsComponent } from './manager/approvals.component';

import { ManagerShellComponent } from './manager/manager-shell.component';
import { OfficerComponent } from './officer/officer.component';
import { roleGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'landing', component: LandingPageComponent },

  { path: 'admin', component: AdminComponent, canActivate: [roleGuard], data: { role: 'admin' } },
  {
    path: 'manager',
    component: ManagerShellComponent,
    canActivate: [roleGuard],
    data: { role: 'bankManager' },
    children: [
      { path: '', component: ManagerComponent },
      { path: 'approvals', component: ApprovalsComponent }]
      
  },
  { path: 'officer', component: OfficerComponent, canActivate: [roleGuard], data: { role: 'bankOfficer' } },

  { path: '', redirectTo: '/landing', pathMatch: 'full' }
];
