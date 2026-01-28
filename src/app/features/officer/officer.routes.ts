 
// src/app/features/officer/officer.routes.ts
import { Routes } from '@angular/router';
import { OfficerLayoutComponent } from './officer-layout/officer-layout.component';
import { CreateAccountComponent } from './create-account/create-account.component';
import { UpdateAccountComponent } from './update-account/update-account.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { AlertsComponent } from './alerts/alerts.component';
 
export const OFFICER_ROUTES: Routes = [
  {
    path: '',
    component: OfficerLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'create' },
      { path: 'create', component: CreateAccountComponent },
      { path: 'update', component: UpdateAccountComponent },
      { path: 'alerts', component: AlertsComponent }, // NEW
      { path: 'history', component: TransactionsComponent },
    ]
  }
];
 
 