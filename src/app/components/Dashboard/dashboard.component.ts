import { Component,Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { LoaderComponent } from '../app-loader/loader.component';
import { ServiceRightsDataRes } from '../../models/ServiceRightsData';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, LoaderComponent, RouterModule ]
})
export class DashboardComponent {
  
  isLoading = false;
  showChatbot = false;
  walletAmount = '';
  services: any[] = [];
  transactionDetails: any[] = [];
  filteredServices: any[] = [];
  rightsData!: ServiceRightsDataRes;
  totalTransaction = '';
  newUsers = '';
  currentIndex = 0;
  slideInterval: any;
  images: string[] = [
    './assets/images/banner1.png',
     './assets/images/banner2.png',
     './assets/images/banner3.png',
      './assets/images/banner4.png',
       './assets/images/banner5.png',
        './assets/images/banner6.png',
  ];
  constructor(
    private dashboardService: DashboardService,
    private _authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadDashboard();
    this.loadRights();
    this.isLoading= false;
  }

  startAutoSlide(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // change slide every 5s
  }

   nextSlide(): void {
     this.currentIndex = Math.min(this.currentIndex + 1, this.images.length - 1);
  }

   prevSlide(): void {
    this.currentIndex = Math.max(this.currentIndex - 1, 0);
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  private loadDashboard(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.walletAmount = data.WalletAmount;
        this.services = data.Services.filter((service: any) => service.ActiveStatus === true);
        this.totalTransaction = data.TotalTransaction;
        this.newUsers = data.UserJoined;
        this.transactionDetails = data._TransactionDetails.map((t: any) => ({
        ...t,
        icon: this.getServiceIcon(t.ServiceName)
      }));
        this.applyFilter();
      },
      error: (err) => console.error('Error loading dashboard', err),
      complete: () => this.checkLoadingDone()
    });
  }

  getServiceIcon(serviceName?: string): string {
  switch (serviceName?.toLowerCase()) {
    case 'mobile recharge':
    case 'dth recharge':
      return 'https://cdn-icons-png.flaticon.com/512/1041/1041881.png';
    case 'bill payment':
      return 'https://cdn-icons-png.flaticon.com/512/4727/4727493.png';
    case 'money transfer':
      return 'https://cdn.pixabay.com/photo/2020/10/17/12/48/money-5661927_640.png';
    case 'aeps':
      return 'https://cdn-icons-png.flaticon.com/512/2313/2313448.png';
    default:
      return 'https://cdn-icons-png.flaticon.com/512/1042/1042090.png'; // fallback (Wallet TopUp)
  }
}


  private loadRights(): void {
    this._authService.getUserRightsInfo(Number(this._authService.getUserId())).subscribe({
      next: (data) => {
       
        this.rightsData=
        {
          microatm: data.microatm,
          aeps: data.aeps,
          mobilerecharge: data.mobilerecharge,
          moneytransfer: data.moneytransfer,
          billpayment: data.billpayment,
          upipayment: 'Active'
        }
        this.applyFilter();
      },
      error: (err) => console.error('Error loading rights info', err),
      complete: () => this.checkLoadingDone()
    });
    this.isLoading= false;
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

  toggleChatbot(): void {
    this.showChatbot = !this.showChatbot;
  }

  closeChatbot(): void {
    this.showChatbot = false;
  }

  formatRouteName(name: string): string {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, ''); // remove spaces
}

slide(direction: number): void {
  const total = this.images.length;
  this.currentIndex += direction;

  if (this.currentIndex < 0) {
    this.currentIndex = total - 1; // loop to last
  } else if (this.currentIndex >= total) {
    this.currentIndex = 0; // loop back to first
  }
}

}
