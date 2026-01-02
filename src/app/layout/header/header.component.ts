import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'
import { AuthService } from '../../services/auth.service';
import { NotificationService, NotificationDto } from '../../services/notification.service';
import { DashboardService } from '../../services/dashboard.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { WalletBalance } from '../../models/DashboardData'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(3px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-3px)' }))
      ])
    ])
  ]
})
export class HeaderComponent {
  walletBalance: WalletBalance | null = null;
  errorMessage = '';
  username = '';
  usertype = '';
  activeNotification?: NotificationDto;
  isVisible = true;
  balance = 12450;
  showBalance = false;
  constructor(private authService: AuthService, private notificationService: NotificationService, private _dashboardService: DashboardService, private _Route: Router) { }

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.usertype = this.authService.getUsertype();
    console.log('Header loaded - Username:', this.username);
    this.loadActiveNotification();
  }


  loadActiveNotification(): void {
    this.notificationService.getNotifications(1, 1000).subscribe(res => {
      this.activeNotification = res.items.find(n => n.status === 'Active');

    },);
  }
  dismissNotification(): void {
    this.isVisible = false;
  }

  viewDetails(): void {
    if (!this.activeNotification) return;
    alert(`Notification Details:\n\n${this.activeNotification.content}`);
  }

  toggleBalance() {
    this.fetchBalance()
  }

  fetchBalance() {

    if (this.authService.getUsertype() == "Retailer") {
      if (this.authService.getUserId() == "" || this.authService.getUsername()=="") {
        this._Route.navigate(['/login']);
        return;
      }
      this.errorMessage = '';
      const userId = this.authService.getUserId()
      const userName = this.authService.getUsername()
      this._dashboardService.getWalletBalance(Number(userId), userName).subscribe({
        next: (res) => {
          this.walletBalance = res;
          this.showBalance = !this.showBalance;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Failed to fetch wallet balance';

        }
      });
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('usertype');  
    localStorage.removeItem('OTP');
    localStorage.removeItem('IsOtpRequired');
    localStorage.removeItem('userid');

    this._Route.navigate(['/login']);
  }


}
