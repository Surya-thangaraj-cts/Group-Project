
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SigninComponent } from './pages/signin/signin.component';
import { RegisterComponent } from './pages/register/register.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { UnauthorizedComponent } from './pages/unauthorized/unauthorized.component';
import { AdminComponent } from './features/admin/admin.component';
import { ManagerComponent } from './features/manager/manager.component';
import { roleGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },

  { path: 'home', component: HomeComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  { path: 'admin', component: AdminComponent, canActivate: [roleGuard], data: { role: 'admin' } },
  { path: 'manager', component: ManagerComponent, canActivate: [roleGuard], data: { role: 'bankManager' } },
  {
    path: 'officer',
    loadChildren: () =>
      import('./features/officer/officer.routes').then(m => m.OFFICER_ROUTES),
    canActivate: [roleGuard], data: { role: 'officer' }
  },

  { path: 'not-found', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent },
];