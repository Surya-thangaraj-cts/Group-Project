
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { AdminComponent } from './admin/admin.component';
import { ManagerComponent } from './manager/manager.component';
import { roleGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'landing' },

  { path: 'landing', component: LandingPageComponent },

  { path: 'admin', component: AdminComponent, canActivate: [roleGuard], data: { role: 'admin' } },
  { path: 'manager', component: ManagerComponent, canActivate: [roleGuard], data: { role: 'bankManager' } },
  {
    path: 'officer',
    loadChildren: () =>
      import('./features/officer/officer.routes').then(m => m.OFFICER_ROUTES),
    canActivate: [roleGuard], data: { role: 'officer' }
  },

  { path: '**', redirectTo: 'landing' },
];