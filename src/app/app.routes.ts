import { Routes } from '@angular/router';
import { ErrorPageComponent } from './components/error-page/error-page.component';
import { LoginComponent } from './components/Login/login.component';
import { DistributorLoginComponent } from './components/Distributor-Login/distributor-login.component';
import { DistributorDashboardComponent } from './components/Distributor-Dashboard/distributor-dashboard.component';
import { MasterDistributorLoginComponent } from './components/Master-Distributor-Login/master-distributor-login.component';
import { ForgetPasswordComponent } from './components/forget-password/forget-password.component';
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
import { ChangepinComponent } from './components/change-pin/changepin.component';
import { AdminConfigComponent } from './components/Feature-Toggle/AdminConfig.component';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './guards/auth.guard';
import { serviceRightGuard } from './guards/service-right.guard';
import { RazorPayPaymentComponent } from './components/RazorPay/RazorPayPayment.component';
import { SettlementComponent } from './components/Settlement/Settlement.component';
import { AppReleaseComponent } from './components/AppRelease/app-release.component';
import { WhatsAppBroadcastComponent } from './components/WhatsApp-Broadcast/whatsapp-broadcast.component';
import { PlanManagementComponent } from './components/PlanManagement/plan-management.component';
import { CommissionSlabComponent } from './components/CommissionSlab/commission-slab.component';
import { PpiLoadWalletComponent } from './components/PPI-Load-Wallet/ppi-load-wallet.component';
import { DistributorUserReportComponent } from './components/Distributor-User-Report/DistributorUserReport.component';
import { MasterDistributorReportComponent } from './components/Master-Distributor-Report/MasterDistributorReport.component';
import { PartnerPaymentRequestComponent } from './components/Partner-Payment-Request/partner-payment-request.component';
import { PartnerPaymentReportComponent } from './components/Partner-Payment-Report/partner-payment-report.component';
import { PartnerTxnReportComponent } from './components/Partner-Txn-Report/partner-txn-report.component';
import { PartnerChangePasswordComponent } from './components/Partner-Change-Password/partner-change-password.component';
import { PartnerChangePinComponent } from './components/Partner-Change-Pin/partner-change-pin.component';
import { RblSettlementComponent } from './components/RBL-Settlement/rbl-settlement.component';
import { WebsiteComponent } from './components/Website/website.component';
import { SalesTeamLoginComponent } from './components/Sales-Team-Login/sales-team-login.component';
import { SalesTeamDashboardComponent } from './components/Sales-Team-Dashboard/sales-team-dashboard.component';
import { SalesTeamOnboardingComponent } from './components/Sales-Team-Onboarding/sales-team-onboarding.component';
import { AdminOnboardingComponent } from './components/Admin-Onboarding/admin-onboarding.component';

export const routes: Routes = [
  { path: '', component: WebsiteComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'distributor-login', component: DistributorLoginComponent },
  { path: 'master-distributor-login', component: MasterDistributorLoginComponent },
  { path: 'salesteam-login', component: SalesTeamLoginComponent },
  { path: 'sales-team/dashboard', component: SalesTeamDashboardComponent, canActivate: [authGuard], data: { partnerRole: 'ST' } },
  { path: 'sales-team/onboardings/new', component: SalesTeamOnboardingComponent, canActivate: [authGuard], data: { partnerRole: 'ST' } },
  { path: 'sales-team/onboardings/:id', component: SalesTeamOnboardingComponent, canActivate: [authGuard], data: { partnerRole: 'ST' } },
  {
    path: 'distributor/dashboard',
    component: DistributorDashboardComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'AD' }
  },
  {
    path: 'master-distributor/dashboard',
    component: DistributorDashboardComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'MD' }
  },
  {
    path: 'distributor/users',
    component: DistributorUserReportComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'AD' }
  },
  {
    path: 'master-distributor/users',
    component: MasterDistributorReportComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'MD' }
  },
  {
    path: 'distributor/payment-request',
    component: PartnerPaymentRequestComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'AD' }
  },
  {
    path: 'master-distributor/payment-request',
    component: PartnerPaymentRequestComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'MD' }
  },
  {
    path: 'distributor/payment-report',
    component: PartnerPaymentReportComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'AD' }
  },
  {
    path: 'master-distributor/payment-report',
    component: PartnerPaymentReportComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'MD' }
  },
  {
    path: 'distributor/txn-report',
    component: PartnerTxnReportComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'AD' }
  },
  {
    path: 'master-distributor/txn-report',
    component: PartnerTxnReportComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'MD' }
  },
  {
    path: 'distributor/change-password',
    component: PartnerChangePasswordComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'AD' }
  },
  {
    path: 'master-distributor/change-password',
    component: PartnerChangePasswordComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'MD' }
  },
  {
    path: 'distributor/change-mpin',
    component: PartnerChangePinComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'AD', pinMode: 'mpin' }
  },
  {
    path: 'master-distributor/change-mpin',
    component: PartnerChangePinComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'MD', pinMode: 'mpin' }
  },
  {
    path: 'distributor/change-txn-pin',
    component: PartnerChangePinComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'AD', pinMode: 'txn' }
  },
  {
    path: 'master-distributor/change-txn-pin',
    component: PartnerChangePinComponent,
    canActivate: [authGuard],
    data: { partnerRole: 'MD', pinMode: 'txn' }
  },
  { path: 'reset-password', component: ForgetPasswordComponent },
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
      { path: 'sales-team-onboarded', component: AdminOnboardingComponent, canActivate: [authGuard] },
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
      { path: 'changepin', component: ChangepinComponent, canActivate: [authGuard] },
      { path: 'featureToggle', component: AdminConfigComponent, canActivate: [authGuard] },
      { path: 'rbl-statement', component: RblSettlementComponent, canActivate: [authGuard] },
      { path: 'rbl-settlement', redirectTo: 'rbl-statement', pathMatch: 'full' },
      { path: 'razorpaypayment', component: RazorPayPaymentComponent, canActivate: [authGuard, serviceRightGuard], data: { serviceRight: 'razorpaypayment' } },
      { path: 'settlement', component: SettlementComponent, canActivate: [authGuard, serviceRightGuard], data: { serviceRight: 'settlement' } },
      { path: 'app-release', component: AppReleaseComponent, canActivate: [authGuard] },
      { path: 'whatsapp-broadcast', component: WhatsAppBroadcastComponent, canActivate: [authGuard] },
      { path: 'plan-management', component: PlanManagementComponent, canActivate: [authGuard] },
      { path: 'commission-slab', component: CommissionSlabComponent, canActivate: [authGuard] },
      { path: 'ppiloadwallet', component: PpiLoadWalletComponent, canActivate: [authGuard] }
    ]
  },

  // ── 4xx Client Errors ───────────────────────────────────────────────────
  { path: 'bad-request',           component: ErrorPageComponent, data: { errorConfig: { code: '400', title: 'Bad Request',                  description: "The server couldn't process the request due to invalid syntax or missing parameters. Please check your input and try again.",                                           icon: 'bi-exclamation-triangle',   colorClass: 'amber',  primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: true  } } },
  { path: 'not-found',             component: ErrorPageComponent, data: { errorConfig: { code: '404', title: 'Page Not Found',               description: "The page you're looking for doesn't exist or may have been moved. Double-check the URL or navigate back to safety.",                                           icon: 'bi-compass',                colorClass: 'purple', primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: true  } } },
  { path: 'forbidden',             component: ErrorPageComponent, data: { errorConfig: { code: '403', title: 'Access Denied',                description: "You don't have permission to view this page. If you believe this is a mistake, please contact your administrator.",                                             icon: 'bi-shield-lock-fill',       colorClass: 'amber',  primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: true  } } },
  { path: 'method-not-allowed',    component: ErrorPageComponent, data: { errorConfig: { code: '405', title: 'Method Not Allowed',           description: "The HTTP method used is not supported for this resource. Please use the correct method or contact support if this persists.",                              icon: 'bi-slash-circle',           colorClass: 'amber',  primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: false } } },
  { path: 'not-acceptable',        component: ErrorPageComponent, data: { errorConfig: { code: '406', title: 'Not Acceptable',               description: "The server cannot produce a response that matches the acceptable values defined in your request headers.",                                                  icon: 'bi-x-circle',               colorClass: 'amber',  primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: false } } },
  { path: 'request-timeout',       component: ErrorPageComponent, data: { errorConfig: { code: '408', title: 'Request Timeout',              description: "The server timed out waiting for your request. Please check your connection and try again.",                                                               icon: 'bi-clock-history',          colorClass: 'blue',   primaryAction: { label: 'Try Again',       action: 'retry' }, showBack: false } } },
  { path: 'conflict',              component: ErrorPageComponent, data: { errorConfig: { code: '409', title: 'Request Conflict',             description: "The request conflicts with the current state of the server. This may be caused by a duplicate action or a version mismatch.",                             icon: 'bi-arrow-left-right',       colorClass: 'amber',  primaryAction: { label: 'Try Again',       action: 'retry' }, showBack: true  } } },
  { path: 'gone',                  component: ErrorPageComponent, data: { errorConfig: { code: '410', title: 'Resource Gone',                description: "The resource you requested has been permanently removed from the server and is no longer available at this address.",                                       icon: 'bi-archive',                colorClass: 'purple', primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: false } } },
  { path: 'precondition-failed',   component: ErrorPageComponent, data: { errorConfig: { code: '412', title: 'Precondition Failed',          description: "The server does not meet one of the preconditions specified in your request headers. Please review your request and try again.",                          icon: 'bi-file-earmark-x',         colorClass: 'amber',  primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: true  } } },
  { path: 'payload-too-large',     component: ErrorPageComponent, data: { errorConfig: { code: '413', title: 'Payload Too Large',            description: "The data you sent exceeds the maximum size the server can accept. Please reduce the payload size and try again.",                                          icon: 'bi-file-earmark-plus',      colorClass: 'amber',  primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: true  } } },
  { path: 'uri-too-long',          component: ErrorPageComponent, data: { errorConfig: { code: '414', title: 'URI Too Long',                 description: "The URL provided is too long for the server to process. Please shorten the URL and try again.",                                                            icon: 'bi-link-45deg',             colorClass: 'amber',  primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: false } } },
  { path: 'unsupported-media',     component: ErrorPageComponent, data: { errorConfig: { code: '415', title: 'Unsupported Media Type',       description: "The server does not support the media format used in your request. Please use a supported format and try again.",                                          icon: 'bi-file-earmark-x',         colorClass: 'amber',  primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: true  } } },
  { path: 'range-not-satisfiable', component: ErrorPageComponent, data: { errorConfig: { code: '416', title: 'Range Not Satisfiable',        description: "The server cannot provide the specific portion of the file you requested. The range specified is not valid.",                                              icon: 'bi-arrows-expand',          colorClass: 'purple', primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: false } } },
  { path: 'account-locked',        component: ErrorPageComponent, data: { errorConfig: { code: '423', title: 'Account Locked',              description: "Your account is temporarily locked. Please try again after 15 minutes or log in again.",                                                              icon: 'bi-lock-fill',              colorClass: 'red',    primaryAction: { label: 'Login Again',     action: 'login' }, showBack: false } } },
  { path: 'too-many-requests',     component: ErrorPageComponent, data: { errorConfig: { code: '429', title: 'Too Many Requests',            description: "You've sent too many requests in a short period. Please wait a moment and try again.",                                                                    icon: 'bi-speedometer2',           colorClass: 'red',    primaryAction: { label: 'Try Again',       action: 'retry' }, showBack: false } } },

  // ── 5xx Server Errors ───────────────────────────────────────────────────
  { path: 'server-error',          component: ErrorPageComponent, data: { errorConfig: { code: '500', title: 'Something Went Wrong',         description: "We hit an unexpected snag on our end. Our team has been notified and is working on a fix. Please try again in a moment.",                                  icon: 'bi-exclamation-circle-fill', colorClass: 'red',   primaryAction: { label: 'Try Again',       action: 'retry' }, showBack: false } } },
  { path: 'not-implemented',       component: ErrorPageComponent, data: { errorConfig: { code: '501', title: 'Not Implemented',              description: "The server does not support the functionality required to fulfil this request. Please contact support if this issue persists.",                             icon: 'bi-code-slash',             colorClass: 'red',    primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: false } } },
  { path: 'bad-gateway',           component: ErrorPageComponent, data: { errorConfig: { code: '502', title: 'Bad Gateway',                  description: "The server received an invalid response from an upstream server. Our team has been notified. Please try again shortly.",                                   icon: 'bi-cloud-slash',            colorClass: 'red',    primaryAction: { label: 'Try Again',       action: 'retry' }, showBack: false } } },
  { path: 'maintenance',           component: ErrorPageComponent, data: { errorConfig: { code: '503', title: 'Under Maintenance',            description: "We're performing scheduled maintenance to improve your experience. We'll be back up and running shortly — thank you for your patience.",                   icon: 'bi-tools',                  colorClass: 'blue',   primaryAction: { label: 'Check Again',     action: 'retry' }, showBack: false } } },
  { path: 'gateway-timeout',       component: ErrorPageComponent, data: { errorConfig: { code: '504', title: 'Gateway Timeout',              description: "The server did not receive a timely response from an upstream server. Please check your connection and try again.",                                        icon: 'bi-hourglass-split',        colorClass: 'blue',   primaryAction: { label: 'Try Again',       action: 'retry' }, showBack: false } } },
  { path: 'version-not-supported', component: ErrorPageComponent, data: { errorConfig: { code: '505', title: 'HTTP Version Not Supported',   description: "The HTTP protocol version used in your request is not supported by the server. Please contact support for assistance.",                                   icon: 'bi-shield-x',               colorClass: 'red',    primaryAction: { label: 'Go to Homepage',  action: 'home'  }, showBack: false } } },

  // fallback — unknown routes show 404 page
  { path: '**', redirectTo: 'not-found' }
];
