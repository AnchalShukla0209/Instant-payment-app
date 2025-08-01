import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { LoaderComponent } from '../app-loader/loader.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule,LoaderComponent]
})
export class DashboardComponent {
  isLoading = false;
  currentIndex = 0;
  showChatbot = false;
   walletAmount = '';
  services: any[] = [];
  totalTransaction = '';
  newUsers = '';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.isLoading=true;
    this.dashboardService.getDashboard().subscribe(data => {
    
      this.walletAmount = data.WalletAmount;
      this.services = data.Services;
      this.totalTransaction = data.TotalTransaction;
      this.newUsers = data.UserJoined;
    });
     this.isLoading=false;
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
