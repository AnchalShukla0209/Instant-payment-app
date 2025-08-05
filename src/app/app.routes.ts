import { Routes } from '@angular/router';
import { LoginComponent } from './components/Login/login.component';
import { DashboardComponent } from './components/Dashboard/dashboard.component';
import { superadmindashboardComponent } from './components/Dashboard/dashboard.superadmin.component';
import { RechargeComponent } from './components/Mobile-Recharge/recharge.component';
import { AEPSComponent } from './components/AEPS/AEPS.component';
import { TxnReportComponent } from './components/TxnReport/txn-report.component';
import { ClientViewListComponent } from './components/Clients/View-Clients.component';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard.superadmin', component: superadmindashboardComponent ,  canActivate: [authGuard]},
      { path: 'dashboard', component: DashboardComponent,  canActivate: [authGuard] },
      { path: 'recharge', component: RechargeComponent, canActivate: [authGuard] },
      { path: 'aeps', component: AEPSComponent, canActivate: [authGuard] },
      { path: 'TxnReport', component: TxnReportComponent, canActivate: [authGuard] },
      { path: 'ClientReport', component: ClientViewListComponent, canActivate: [authGuard] }
      // Add more protected routes below
      // { path: 'billpayment', component: BillPaymentComponent, canActivate: [authGuard] }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
