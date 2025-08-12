import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  username = '';
  usertype ='';
  microATM='';
  moneyTransfer='';
  billPayment='';
  Recharge='';
  aeps='';
  constructor(private authService: AuthService,private http: HttpClient ) {}
  ngOnInit(): void {
  this.username = this.authService.getUsername();
  this.usertype = this.authService.getUsertype();

  if(this.usertype=='Retailer')
  {
       this.loadRightsInfo(this.authService.getUserId());
  }
  
}

   loadRightsInfo(id: number): void {
    this.authService.getUserRightsInfo(id).subscribe({
      next: (data) => {
        this.microATM= data.microatm;
        this.moneyTransfer=data.moneytransfer;
        this.billPayment= data.billpayment;
        this.Recharge= data.recharge;
        this.aeps= data.aeps;
      },
      error: (err) => {
        console.error('Error loading rights info:', err);
        
      }
    });
  }

  
}