import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { EMPTY, Subject, catchError, filter, finalize, switchMap, takeUntil, timer } from 'rxjs';
import { DistributorAuthService } from '../../services/distributor-auth.service';
import { PartnerDashboardService } from '../../services/partner-dashboard.service';

export type PartnerShellMenu =
  | 'dashboard'
  | 'users'
  | 'payment-request'
  | 'payment-report'
  | 'txn-report'
  | 'change-password'
  | 'change-mpin'
  | 'change-txn-pin';

/**
 * Common left sidebar + top header shell shared by every internal Distributor/Master
 * Distributor page (Dashboard, Manage Users, ...). Wrap page content with
 * `<app-partner-shell activeMenu="...">...</app-partner-shell>` to get a consistent
 * navigation experience with a mobile-friendly sidebar toggle.
 */
@Component({
  selector: 'app-partner-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './partner-shell.component.html',
  styleUrls: ['./partner-shell.component.scss']
})
export class PartnerShellComponent implements OnInit, OnDestroy {
  @Input() activeMenu: PartnerShellMenu = 'dashboard';

  private readonly distributorAuth = inject(DistributorAuthService);
  private readonly dashboardService = inject(PartnerDashboardService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly session = this.distributorAuth.getSession();
  /** True = sidebar visible. Desktop: toggling reclaims the content width. Mobile: toggling shows/hides an overlay. */
  sidebarOpen = true;
  settingsOpen = false;
  walletAmount: number | null = null;
  walletRefreshing = false;
  walletRefreshedAt: Date | null = null;

  private static readonly MOBILE_BREAKPOINT = 900;

  get roleLabel(): string {
    return this.session?.userType === 'MD' ? 'Master Distributor' : 'Distributor';
  }

  get usersRoute(): string {
    return this.session?.userType === 'MD' ? '/master-distributor/users' : '/distributor/users';
  }

  get paymentRequestRoute(): string {
    return this.session?.userType === 'MD' ? '/master-distributor/payment-request' : '/distributor/payment-request';
  }

  get paymentReportRoute(): string {
    return this.session?.userType === 'MD' ? '/master-distributor/payment-report' : '/distributor/payment-report';
  }

  get txnReportRoute(): string {
    return this.session?.userType === 'MD' ? '/master-distributor/txn-report' : '/distributor/txn-report';
  }

  get changePasswordRoute(): string {
    return this.session?.userType === 'MD'
      ? '/master-distributor/change-password'
      : '/distributor/change-password';
  }

  get changeMpinRoute(): string {
    return this.session?.userType === 'MD'
      ? '/master-distributor/change-mpin'
      : '/distributor/change-mpin';
  }

  get changeTxnPinRoute(): string {
    return this.session?.userType === 'MD'
      ? '/master-distributor/change-txn-pin'
      : '/distributor/change-txn-pin';
  }

  get isSettingsActive(): boolean {
    return this.activeMenu === 'change-password' ||
      this.activeMenu === 'change-mpin' ||
      this.activeMenu === 'change-txn-pin';
  }

  toggleSettings(): void {
    this.settingsOpen = !this.settingsOpen;
  }

  get isMobileScreen(): boolean {
    return window.innerWidth <= PartnerShellComponent.MOBILE_BREAKPOINT;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.sidebarOpen = !this.isMobileScreen;
  }

  ngOnInit(): void {
    this.sidebarOpen = !this.isMobileScreen;
    this.settingsOpen = this.isSettingsActive;
    this.refreshWallet();

    timer(30_000, 30_000)
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        switchMap(() => this.dashboardService.getWallet().pipe(catchError(() => EMPTY))),
        takeUntil(this.destroy$)
      )
      .subscribe(wallet => {
        this.walletAmount = wallet.walletAmount;
        this.walletRefreshedAt = new Date(wallet.refreshedAtUtc);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshWallet(): void {
    if (this.walletRefreshing) return;
    this.walletRefreshing = true;
    this.dashboardService.getWallet()
      .pipe(
        finalize(() => (this.walletRefreshing = false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: wallet => {
          this.walletAmount = wallet.walletAmount;
          this.walletRefreshedAt = new Date(wallet.refreshedAtUtc);
        },
        error: () => {}
      });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /** Called on nav-link clicks / overlay clicks: only auto-hide the sidebar on mobile,
   * where it renders as an overlay. On desktop it stays open until the user toggles it. */
  closeSidebar(): void {
    if (this.isMobileScreen) {
      this.sidebarOpen = false;
    }
  }

  logout(): void {
    this.distributorAuth.clearSession();
    const loginRoute = this.session?.userType === 'MD'
      ? '/master-distributor-login'
      : '/distributor-login';
    void this.router.navigate([loginRoute]);
  }
}
