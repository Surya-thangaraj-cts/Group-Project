import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { AdminComponent } from './admin/admin.component';
import { ManagerComponent } from './manager/manager.component';
import { OfficerComponent } from './officer/officer.component';
import { roleGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'landing', component: LandingPageComponent },

  { path: 'admin', component: AdminComponent, canActivate: [roleGuard], data: { role: 'admin' } },
  { path: 'manager', component: ManagerComponent, canActivate: [roleGuard], data: { role: 'bankManager' } },
  { path: 'officer', component: OfficerComponent, canActivate: [roleGuard], data: { role: 'bankOfficer' } },

  { path: '', redirectTo: '/landing', pathMatch: 'full' }
];