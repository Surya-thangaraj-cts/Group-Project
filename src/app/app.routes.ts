import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SigninComponent } from './components/signin/signin.component';
import { RegisterComponent } from './components/register/register.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { RestrictedAccessComponent } from './components/restricted-access/restricted-access.component';
import { AdminComponent } from './admin/admin.component';
import { ManagerComponent } from './manager/manager.component';
import { roleGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },

  { path: 'home', component: HomeComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'restricted', component: RestrictedAccessComponent },

  { path: 'admin', component: AdminComponent, canActivate: [roleGuard], data: { role: 'admin' } },
  { path: 'manager', component: ManagerComponent, canActivate: [roleGuard], data: { role: 'bankManager' } },
  {
    path: 'officer',
    loadChildren: () =>
      import('./features/officer/officer.routes').then(m => m.OFFICER_ROUTES),
    canActivate: [roleGuard], data: { role: 'officer' }
  },
  
  { path: '**', component: NotFoundComponent },
];