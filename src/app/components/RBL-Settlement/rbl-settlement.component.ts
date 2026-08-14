import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { RblStatementService } from '../../services/rbl-statement.service';

@Component({
  selector: 'app-rbl-settlement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rbl-settlement.component.html',
  styleUrls: ['./rbl-settlement.component.scss']
})
export class RblSettlementComponent implements OnInit {
  mode: 'range' | 'period' = 'range';
  fromDate = '';
  toDate = '';
  transactionType = 'B';
  period = 'M';
  loading = false;
  searched = false;
  balance: any = null;
  transactions: any[] = [];
  hasMoreData = false;
  maxDate = '';

  constructor(private statements: RblStatementService, private auth: AuthService,
    private router: Router, private toastr: ToastrService) {}

  ngOnInit(): void {
    if (this.auth.getUsertype() !== 'SuperAdmin') {
      this.router.navigate(['/forbidden']);
      return;
    }
    const today = new Date();
    this.maxDate = this.toInputDate(today);
    this.toDate = this.maxDate;
    const start = new Date(today);
    start.setDate(start.getDate() - 14);
    this.fromDate = this.toInputDate(start);
  }

  fetchStatement(): void {
    if (this.mode === 'range' && (!this.fromDate || !this.toDate || this.fromDate > this.toDate)) {
      this.toastr.warning('Select a valid date range');
      return;
    }
    this.loading = true;
    const request = this.mode === 'range'
      ? this.statements.getDateRange(this.fromDate, this.toDate, this.transactionType)
      : this.statements.getPeriod(this.period, this.transactionType);
    request.subscribe({
      next: response => {
        const root = response?.Acc_Stmt_DtRng_Res || response?.Acc_Stmt_Period_Res;
        if (!root || root?.Header?.Status?.toUpperCase() !== 'SUCCESS') {
          this.toastr.error(root?.Header?.Error_Desc || 'RBL could not return the statement');
          this.clearResults(); return;
        }
        const body = root.Body || {};
        this.balance = body.accountBalances || null;
        const details = body.transactionDetails;
        this.transactions = Array.isArray(details) ? details : (details?.Item || []);
        this.hasMoreData = String(body.hasMoreData || '').toUpperCase() === 'Y';
        this.searched = true;
        this.loading = false;
      },
      error: error => {
        this.clearResults();
        this.toastr.error(error?.error?.message || error?.error?.Acc_Stmt_DtRng_Res?.Header?.Error_Desc || 'Statement service is unavailable');
      }
    });
  }

  amount(item: any): string { return item?.amountValue ?? '0.00'; }
  trackTxn(_: number, item: any): string { return `${item?.txnId}-${item?.txnSrlNo}`; }
  private clearResults(): void { this.loading = false; this.searched = true; this.balance = null; this.transactions = []; }
  private toInputDate(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }
}
