import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { AdminComponent } from './admin/admin.component';
import { ManagerComponent } from './manager/manager.component';
import { OfficerComponent } from './officer/officer.component';


export const routes: Routes = [
  { path: 'landing', component: LandingPageComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'manager', component: ManagerComponent },
  { path: 'officer', component: OfficerComponent },
  { path: '', redirectTo: '/landing', pathMatch: 'full' }
];

