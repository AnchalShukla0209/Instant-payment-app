import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { RblStatementService } from '../../services/rbl-statement.service';
import html2pdf from 'html2pdf.js';

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
  searchText = '';
  currentPage = 1;
  pageSize = 10;

  get filteredTransactions(): any[] {
    const term = this.searchText.trim().toLowerCase();
    if (!term) return this.transactions;
    return this.transactions.filter(txn => [txn?.txnId, txn?.transactionSummary?.txnDesc, txn?.transactionSummary?.txnType]
      .some(value => String(value || '').toLowerCase().includes(term)));
  }
  get pagedTransactions(): any[] { return this.filteredTransactions.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize); }
  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize)); }
  get totalCredits(): number { return this.sumByType('C'); }
  get totalDebits(): number { return this.sumByType('D'); }

  constructor(private statements: RblStatementService, private auth: AuthService,
    private router: Router, private toastr: ToastrService) {}

  ngOnInit(): void {
    if (this.auth.getUsertype() !== 'SuperAdmin') {
      this.router.navigate(['/forbidden']);
      return;
    }
    this.setDefaultDates();
  }

  resetFilters(): void {
    this.mode = 'range';
    this.transactionType = 'B';
    this.period = 'M';
    this.loading = false;
    this.searched = false;
    this.balance = null;
    this.transactions = [];
    this.hasMoreData = false;
    this.searchText = '';
    this.currentPage = 1;
    this.setDefaultDates();
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
        this.currentPage = 1;
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
  changePage(page: number): void { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }
  async exportExcel(): Promise<void> {
    const xlsx = await import('xlsx');
    const rows = this.filteredTransactions.map(txn => ({
      Date: txn.txnSummary?.txnDate || txn.transactionSummary?.txnDate || '', Reference: txn.txnId?.trim() || '',
      Description: txn.transactionSummary?.txnDesc?.trim() || '', Type: txn.transactionSummary?.txnType === 'C' ? 'Credit' : 'Debit',
      Amount: Number(this.amount(txn.transactionSummary?.txnAmt)), Balance: Number(this.amount(txn.txnBalance))
    }));
    const sheet = xlsx.utils.json_to_sheet(rows); const book = xlsx.utils.book_new(); xlsx.utils.book_append_sheet(book, sheet, 'RBL Statement');
    xlsx.writeFile(book, `RBL-Statement-${this.toDate || this.period}.xlsx`);
  }
  exportPdf(): void {
    const element = document.getElementById('rblStatementExport');
    if (element) html2pdf().set({ margin: 8, filename: `RBL-Statement-${this.toDate || this.period}.pdf`, html2canvas: { scale: 2 }, jsPDF: { orientation: 'landscape' } }).from(element).save();
  }
  private sumByType(type: string): number { return this.transactions.filter(txn => txn?.transactionSummary?.txnType === type).reduce((sum, txn) => sum + Number(this.amount(txn.transactionSummary?.txnAmt)), 0); }
  private clearResults(): void { this.loading = false; this.searched = true; this.balance = null; this.transactions = []; }
  private setDefaultDates(): void {
    const today = new Date();
    this.maxDate = this.toInputDate(today);
    this.toDate = this.maxDate;
    const start = new Date(today);
    start.setDate(start.getDate() - 14);
    this.fromDate = this.toInputDate(start);
  }
  private toInputDate(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }
}
