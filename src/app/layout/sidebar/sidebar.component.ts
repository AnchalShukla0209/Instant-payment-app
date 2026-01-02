import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { DashboardService } from '../../services/dashboard.service';
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
  walletAmount = 0;
  totalTransaction = 0;
  newUsers = 0;
  services: { ServiceName: string; ServiceImagePath: string; routeKey: string; ActiveStatus: boolean }[] = [];
  constructor(private authService: AuthService, private http: HttpClient, private dashboardService: DashboardService, private router: Router) { }
  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.usertype = this.authService.getUsertype();

    if (this.usertype == 'Retailer') {
      this.loadDashboard();

    }

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
        const masterServices = data.Services;
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
        // Normalize user rights keys
        const normalizedUserRights: Record<string, string> = {};
        Object.keys(userServices).forEach((k) => {
          normalizedUserRights[this.normalizeKey(k)] = userServices[k];
        });

        // Filter master services
        this.services = masterServices
          .filter((srv) => normalizedUserRights[this.normalizeKey(srv.ServiceName)] === 'Active')
          .map((srv) => ({
            ...srv,
            routeKey: String(srv.ServiceName).replace(/[\s()]/g, '').toLowerCase()
          }));

          console.log(this.services);

      },
      error: (err) => console.error('Error loading rights info:', err)
    });
  }

  private normalizeKey(key: string): string {
    return key.replace(/[\s()]/g, '').toLowerCase();
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('usertype');  
    localStorage.removeItem('OTP');
    localStorage.removeItem('IsOtpRequired');
    localStorage.removeItem('userid');

    this.router.navigate(['/login']);
  }

  CheckServiceStatus(key: string, isActive: boolean, serviceName: string)
  {
      if(isActive)
      {
        this.router.navigate(['/' + key]);
      }
      else
      {
          Swal.fire('Validation', 'The '+serviceName+' is currently down or not active. Please contact to admin.', 'warning');
          return;
      }
  }


}