import { Component, OnInit } from '@angular/core';
import { GetUsersWithMainBalanceQuery } from '../../models/ClientData';
import { ClientReportService } from '../../services/Client-report.service';
import { HttpClient } from '@angular/common/http';
import { LoaderComponent } from '../app-loader/loader.component';
import { ToastrService } from 'ngx-toastr';
import { FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-txn-report',
  standalone: true,
  imports: [FormsModule,LoaderComponent,CommonModule ],
  templateUrl: './View-Clients.component.html',
  styleUrls: ['./View-Clients.component.scss']
})

export class ClientViewListComponent implements OnInit {
  
users: any[] = [];
  paginatedUsers: any[] = [];
  totalRecords: number = 0;
  totalPages: number = 0;
  pageIndex: number = 1;
  pageSize: number = 10;
  searchKeyword: string = '';
  fromDate: string = '';
  toDate: string = '';
  isLoading: boolean = false;
  TotalBalance:Number=0;
  ShowTotalBalance: boolean= false;

  constructor(private http: HttpClient, private toastr: ToastrService, private _clientservice: ClientReportService) {}

  ngOnInit() {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
     const payload: GetUsersWithMainBalanceQuery = {
     pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      fromDate: this.fromDate,
      toDate: this.toDate
        };

        
    this._clientservice.getClientReport(payload).subscribe({
      next: (res: any) => {
        debugger
        this.users = res.Users || [];
        //this.paginatedUsers = res.Users || [];
        this.totalRecords = res.TotalRecords || 0;
        this.totalPages = Math.ceil(this.totalRecords / res.PageSize);
        
        this.TotalBalance= res.TotalBalance || 0
        this.isLoading = false;
        this.applyFilter();
      },
      error: () => (this.isLoading = false),
    });
  }

  applyFilter(): void {
    const keyword = this.searchKeyword.toLowerCase();
    this.paginatedUsers = this.users.filter(user =>
      user.UserName?.toLowerCase().includes(keyword) ||
      user.CompanyName?.toLowerCase().includes(keyword) ||
      user.Domain?.toLowerCase().includes(keyword) ||
      user.City?.toLowerCase().includes(keyword)||
      user.Status?.toLowerCase().includes(keyword)||
      user.EmailId?.toLowerCase().includes(keyword)//||
      //user.MainBalance.includes(keyword)
      
    );
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.pageIndex = page;
    this.loadClients();
  }

  getTotalBalance(): void {

    this.toastr.success('Total balance is: '+ this.TotalBalance, 'success');
    this.ShowTotalBalance=true;
  }

  onAddNew(): void {
    this.toastr.info('Redirect to Add New Client UI');
  }

  getVisiblePages(): (number | null)[] {
  const total = this.totalPages;
  const current = this.pageIndex;
  const pages: (number | null)[] = [];

  if (total <= 10) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);

    if (current > 5) pages.push(null); // null for "..."

    const start = Math.max(2, current - 2);
    const end = Math.min(total - 1, current + 2);

    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 4) pages.push(null);

    pages.push(total);
  }

  return pages;
}

}


