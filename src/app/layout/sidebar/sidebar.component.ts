import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from '../../services/dashboard.service';
import { WebsiteInfoService, WebsiteInfo } from '../../services/website-info.service';
import { AdminConfigService } from '../../services/admin.service';
import Swal from 'sweetalert2'



@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})

export class SidebarComponent {
  username = '';
  usertype = '';
  microATM = '';
  moneyTransfer = '';
  billPayment = '';
  Recharge = '';
  aeps = '';
  razorpayPayment = 'Inactive';
  settlement = 'Inactive';
  walletAmount = 0;
  totalTransaction = 0;
  newUsers = 0;
  services: { ServiceName: string; ServiceImagePath: string; routeKey: string; ActiveStatus: boolean }[] = [];
  websiteInfo: WebsiteInfo | null = null;
  logoUrl: string = '../../../assets/images/logo__.png';
  latestApk: { versionName: string; versionCode: number; downloadUrl: string; releaseNotes: string; fileSizeBytes: number; uploadedAt: string } | null = null;

  constructor(private authService: AuthService, private http: HttpClient, private dashboardService: DashboardService, private router: Router, private websiteInfoService: WebsiteInfoService, private adminApi: AdminConfigService) { }
  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.usertype = this.authService.getUsertype();
    this.loadWebsiteInfo();

    if (this.usertype == 'Retailer') {
      this.loadDashboard();
      this.loadLatestApk();
    }

  }

  loadWebsiteInfo(): void {
    this.websiteInfoService.getWebsiteInfo().subscribe({
      next: (info) => {
        if (info && info.isActive) {
          this.websiteInfo = info;
          if (info.logoUrl) {
            this.logoUrl = info.logoUrl;
          }
        }
      },
      error: (err) => {
        console.warn('Failed to load website info:', err);
      }
    });
  }

  //  loadRightsInfo(id: number): void {
  //   this.authService.getUserRightsInfo(id).subscribe({
  //     next: (data) => {
  //       this.microATM= data.microatm;
  //       this.moneyTransfer=data.moneytransfer;
  //       this.billPayment= data.billpayment;
  //       this.Recharge= data.recharge;
  //       this.aeps= data.aeps;
  //     },
  //     error: (err) => {
  //       console.error('Error loading rights info:', err);

  //     }
  //   });
  // }

  private loadDashboard(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        const masterServices =  data.Services.filter((service: any) => service.ActiveStatus === true);
        // Example: [ { ServiceName: 'Mobile Recharge', ServiceImagePath: '...' }, { ServiceName: 'AEPS', ServiceImagePath: '...' } ]

        this.walletAmount = data.WalletAmount;
        this.totalTransaction = data.TotalTransaction;
        this.newUsers = data.UserJoined;

        if (this.usertype === 'Retailer') {
          this.loadRightsInfo(Number(this.authService.getUserId()), masterServices);
        } else {
          this.services = masterServices; // non-retailers see all active master services
        }
      },
      error: (err) => console.error('Error loading dashboard', err)
    });
  }


  private loadRightsInfo(id: number, masterServices: any[]): void {
    this.authService.getUserRightsInfo(id).subscribe({
      next: (userServices: any) => {
        this.razorpayPayment = userServices.razorpaypayment || 'Inactive';
        this.settlement = userServices.settlement || 'Inactive';

        const normalizedUserRights: Record<string, string> = {};
        Object.keys(userServices).forEach((k) => {
          normalizedUserRights[this.normalizeKey(k)] = userServices[k];
        });

        this.services = masterServices
          .filter((srv) => {
            const key = this.normalizeKey(srv.ServiceName);
            const rightsKey = key === 'onlinepayment' || key === 'razorpay'
              ? 'razorpaypayment'
              : key;
            const status = normalizedUserRights[rightsKey];

            // ✅ Allow if Active OR not defined
            return status === 'Active' || status === undefined;
          })
          .map((srv) => ({
            ...srv,
            routeKey: String(srv.ServiceName)
              .replace(/[\s()]/g, '')
              .toLowerCase()
          }));

        console.log(this.services);
      },
      error: (err) => console.error('Error loading rights info:', err)
    });
  }

  loadLatestApk(): void {
    this.adminApi.getLatestApkRelease().subscribe({
      next: (res) => {
        if (res?.success && res?.data) {
          this.latestApk = res.data;
        }
      },
      error: () => {}
    });
  }

  formatApkSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private normalizeKey(key: string): string {
    return key.replace(/[\s()]/g, '').toLowerCase();
  }
  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  CheckServiceStatus(key: string, isActive: boolean, serviceName: string) {
    if (isActive) {
      this.router.navigate(['/' + key]);
    }
    else {
      Swal.fire('Validation', 'The ' + serviceName + ' is currently down or not active. Please contact to admin.', 'warning');
      return;
    }
  }


}