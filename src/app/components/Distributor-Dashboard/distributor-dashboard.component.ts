import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  NgApexchartsModule
} from 'ng-apexcharts';
import {
  EMPTY,
  Subject,
  catchError,
  filter,
  finalize,
  switchMap,
  takeUntil,
  timer
} from 'rxjs';
import { PartnerDashboard } from '../../models/partner-dashboard.model';
import { DistributorAuthService } from '../../services/distributor-auth.service';
import { PartnerDashboardService } from '../../services/partner-dashboard.service';
import { PartnerShellComponent } from '../Partner-Shell/partner-shell.component';

type TransactionChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
};

@Component({
  selector: 'app-distributor-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, RouterLink, PartnerShellComponent],
  templateUrl: './distributor-dashboard.component.html',
  styleUrl: './distributor-dashboard.component.scss'
})
export class DistributorDashboardComponent implements OnInit, OnDestroy {
  private readonly distributorAuth = inject(DistributorAuthService);
  private readonly dashboardService = inject(PartnerDashboardService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly session = this.distributorAuth.getSession();
  dashboard: PartnerDashboard | null = null;
  loading = true;
  walletRefreshing = false;
  errorMessage = '';
  walletRefreshedAt: Date | null = null;

  chartOptions: TransactionChartOptions = {
    series: [],
    chart: {
      type: 'area',
      height: 310,
      toolbar: { show: false },
      animations: { enabled: true, speed: 500 }
    },
    xaxis: { categories: [], labels: { style: { colors: '#786b82' } } },
    stroke: { curve: 'smooth', width: 2.4 },
    dataLabels: { enabled: false },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.26, opacityTo: 0.02, stops: [0, 95, 100] }
    },
    grid: { borderColor: '#eee8f2', strokeDashArray: 4 },
    tooltip: { shared: true, y: { formatter: value => `₹${value.toLocaleString('en-IN')}` } },
    legend: { position: 'top', horizontalAlign: 'right' },
    colors: ['#278d69', '#ffb51b', '#d84b5d', '#447eef']
  };

  get roleLabel(): string {
    return this.session?.userType === 'MD' ? 'Master Distributor' : 'Distributor';
  }

  ngOnInit(): void {
    timer(0, 60_000)
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        switchMap(() => this.dashboardService.getDashboard(7).pipe(
          catchError(() => {
            this.errorMessage = 'Dashboard data is temporarily unavailable.';
            this.loading = false;
            return EMPTY;
          })
        )),
        takeUntil(this.destroy$)
      )
      .subscribe(data => this.applyDashboard(data));

    timer(30_000, 30_000)
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        switchMap(() => this.dashboardService.getWallet().pipe(catchError(() => EMPTY))),
        takeUntil(this.destroy$)
      )
      .subscribe(wallet => {
        if (this.dashboard) {
          this.dashboard = { ...this.dashboard, walletAmount: wallet.walletAmount };
          this.walletRefreshedAt = new Date(wallet.refreshedAtUtc);
        }
      });
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
          if (this.dashboard) {
            this.dashboard = { ...this.dashboard, walletAmount: wallet.walletAmount };
            this.walletRefreshedAt = new Date(wallet.refreshedAtUtc);
          }
        },
        error: () => (this.errorMessage = 'Wallet refresh failed. Please try again.')
      });
  }

  logout(): void {
    this.distributorAuth.clearSession();
    const loginRoute = this.session?.userType === 'MD'
      ? '/master-distributor-login'
      : '/distributor-login';
    void this.router.navigate([loginRoute]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById(_: number, item: { userId: number }): number {
    return item.userId;
  }

  private applyDashboard(data: PartnerDashboard): void {
    this.dashboard = data;
    this.loading = false;
    this.errorMessage = '';
    this.walletRefreshedAt = new Date(data.generatedAtUtc);
    this.chartOptions = {
      ...this.chartOptions,
      series: [
        { name: 'Success', data: data.transactionChart.map(point => point.success) },
        { name: 'Pending', data: data.transactionChart.map(point => point.pending) },
        { name: 'Failed', data: data.transactionChart.map(point => point.failed) },
        { name: 'Process', data: data.transactionChart.map(point => point.process) }
      ],
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: data.transactionChart.map(point =>
          new Date(point.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
          })
        )
      }
    };
  }
}
