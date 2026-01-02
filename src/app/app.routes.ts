import { Routes } from '@angular/router';
import { LoginComponent } from './components/Login/login.component';
import { DashboardComponent } from './components/Dashboard/dashboard.component';
import { superadmindashboardComponent } from './components/Dashboard/dashboard.superadmin.component';
import { RechargeComponent } from './components/Mobile-Recharge/recharge.component';
import { AEPSComponent } from './components/AEPS/AEPS.component';
import { TxnReportComponent } from './components/TxnReport/txn-report.component';
import { ClientViewListComponent } from './components/Clients/View-Clients.component';
import { ClientUserDetailComponent } from './components/Clients-User/Clients-User.component';
import { MarginList } from './components/Margin/margin.component';
import { MoneyTransferComponent } from './components/Money-Transfer/Money-Transfer.component';
import { NotificationList } from './components/Notification/Notification.component';
import { ServiceListComponent } from './components/Services/Services.component';
import { BankListComponent } from './components/BankMgmt/bank.component';
import { PaymentRequestComponent } from './components/Payment-Request/Payment-Request.component';
import { PaymentRequestAdminComponent } from './components/Payment-Request-Admin/Payment-Request-Admin.component';
import { PaymentRequestUserComponent } from './components/Payment-Request-User/Payment-Request-User.component';
import { BillPaymentComponent } from './components/Bill-Payment/Bill-Payment.component';
import { UserTxnReport } from './components/UserTxnReport/UserTxnReport.component';
import { ChangePasswordComponent } from './components/change-password/changepassword.component';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard.superadmin', component: superadmindashboardComponent, canActivate: [authGuard] },
      { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
      { path: 'mobilerecharge', component: RechargeComponent, canActivate: [authGuard] },
      { path: 'aeps', component: AEPSComponent, canActivate: [authGuard] },
      { path: 'TxnReport', component: TxnReportComponent, canActivate: [authGuard] },
      { path: 'ClientReport', component: ClientViewListComponent, canActivate: [authGuard] },
      { path: 'ClientUsersReport/:id', component: ClientUserDetailComponent, canActivate: [authGuard] },
      { path: 'MarginList', component: MarginList, canActivate: [authGuard] },
      { path: 'moneytransfer', component: MoneyTransferComponent, canActivate: [authGuard] },
      { path: 'notification-hub', component: NotificationList, canActivate: [authGuard] },
      { path: 'service-list', component: ServiceListComponent, canActivate: [authGuard] },
      { path: 'bank-mgmt', component: BankListComponent, canActivate: [authGuard] },
      { path: 'Payment-Request', component: PaymentRequestComponent, canActivate: [authGuard] },
      { path: 'Payment-Request-Admin', component: PaymentRequestAdminComponent, canActivate: [authGuard] },
      { path: 'Payment-Request-User-Report', component: PaymentRequestUserComponent, canActivate: [authGuard] },
      { path: 'billpayment', component: BillPaymentComponent, canActivate: [authGuard] },
      { path: 'UserTxnReports', component: UserTxnReport, canActivate: [authGuard] },
      { path: 'changepassword', component: ChangePasswordComponent, canActivate: [authGuard] },
    ]
  },

  // 👇 default route (empty path) redirects to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // fallback
  { path: '**', redirectTo: 'login' }
];

