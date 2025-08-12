import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { LoaderComponent } from '../app-loader/loader.component';
import { ServiceRightsDataRes } from '../../models/ServiceRightsData';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, LoaderComponent]
})
export class DashboardComponent {
  isLoading = false;
  currentIndex = 0;
  showChatbot = false;
  walletAmount = '';
  services: any[] = [];
  filteredServices: any[] = [];
  rightsData!: ServiceRightsDataRes;
  totalTransaction = '';
  newUsers = '';

  constructor(
    private dashboardService: DashboardService,
    private _authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadDashboard();
    this.loadRights();
  }

  private loadDashboard(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.walletAmount = data.WalletAmount;
        this.services = data.Services;
        debugger
        this.totalTransaction = data.TotalTransaction;
        this.newUsers = data.UserJoined;
        this.applyFilter();
      },
      error: (err) => console.error('Error loading dashboard', err),
      complete: () => this.checkLoadingDone()
    });
  }

  private loadRights(): void {
    this._authService.getUserRightsInfo(this._authService.getUserId()).subscribe({
      next: (data) => {
       
        this.rightsData=
        {
          microatm: data.microatm,
          aeps: data.aeps,
          mobilerecharge: data.recharge,
          moneytransfer: data.moneytransfer,
          billpayment: data.billpayment,
          upipayment: 'Active'
        }
        this.applyFilter();
      },
      error: (err) => console.error('Error loading rights info', err),
      complete: () => this.checkLoadingDone()
    });
  }

  private applyFilter(): void {
    // Only filter when both datasets are available
    if (!this.rightsData || this.services.length === 0) {
      return;
    }

    this.filteredServices = this.services.filter(s => {
      const key = s.ServiceName.replace(/[\s()]/g, '').toLowerCase();
      return (this.rightsData as any)[key] === 'Active';
    });
  }

  private checkLoadingDone(): void {
    // Hide loader when both APIs have been called at least once
    if (this.services.length > 0 && this.rightsData) {
      this.isLoading = false;
    }
  }

  slide(direction: number): void {
    this.currentIndex += direction;
    this.currentIndex = Math.max(0, Math.min(1, this.currentIndex));
  }

  toggleChatbot(): void {
    this.showChatbot = !this.showChatbot;
  }

  closeChatbot(): void {
    this.showChatbot = false;
  }
}
