import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PartnerPaymentService } from '../../services/partner-payment.service';
import { PaymentResponse, PaginatedPaymentResponse } from '../../models/payment-request.model';
import { LoaderComponent } from '../app-loader/loader.component';
import { PartnerShellComponent } from '../Partner-Shell/partner-shell.component';

/**
 * Distributor / Master Distributor's own wallet top-up request history - the partner
 * equivalent of the retailer `/Payment-Request-User-Report` page. Read-only (no
 * approve/reject - that stays an admin-only capability); scoping to "my own requests" is
 * enforced server-side by `PartnerPaymentController`, not by client-side filtering. Reused
 * for both `/distributor/payment-report` and `/master-distributor/payment-report`.
 */
@Component({
  selector: 'app-partner-payment-report',
  standalone: true,
  imports: [FormsModule, CommonModule, LoaderComponent, PartnerShellComponent],
  templateUrl: './partner-payment-report.component.html',
  styleUrls: ['./partner-payment-report.component.scss']
})
export class PartnerPaymentReportComponent implements OnInit {
  payments: PaymentResponse[] = [];
  paginatedPayments: PaymentResponse[] = [];
  exportdataPayments: PaymentResponse[] = [];
  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  searchKeyword = '';
  isLoading = false;
  visiblePages: (number | null)[] = [];
  selectedRowIndex: number | null = null;

  fromDate?: string;
  toDate?: string;
  statusFilter?: string = '';

  constructor(private readonly service: PartnerPaymentService) {}

  private formatDateLocal(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  ngOnInit(): void {
    this.loadPayments(this.currentPage, this.pageSize);
  }

  loadPayments(pageIndex: number, pageSize: number): void {
    this.isLoading = true;
    this.service.getAllPayments(pageIndex, pageSize, this.statusFilter, this.fromDate, this.toDate, '', 0)
      .subscribe({
        next: (res: PaginatedPaymentResponse) => {
          this.payments = res.payments;
          this.totalRecords = res.totalCount;
          this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
          this.currentPage = pageIndex;
          this.updateVisiblePages();
          this.paginatedPayments = this.payments;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false)
      });
  }

  updateVisiblePages(): void {
    const pages: (number | null)[] = [];
    if (this.totalPages <= 7) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.currentPage > 4) pages.push(null);
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (this.currentPage < this.totalPages - 3) pages.push(null);
      pages.push(this.totalPages);
    }
    this.visiblePages = pages;
  }

  selectRow(index: number): void {
    this.selectedRowIndex = index;
  }

  applyFilter(): void {
    this.isLoading = true;
    const keyword = this.searchKeyword.toLowerCase();
    this.service.getAllPayments(1, this.pageSize, this.statusFilter, this.fromDate, this.toDate, keyword, 0)
      .subscribe({
        next: (res: PaginatedPaymentResponse) => {
          this.payments = res.payments;
          this.totalRecords = res.totalCount;
          this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
          this.currentPage = 1;
          this.updateVisiblePages();
          this.paginatedPayments = this.payments;
          this.isLoading = false;
        },
        error: () => (this.isLoading = false)
      });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadPayments(page, this.pageSize);
  }

  resetFilters(): void {
    this.searchKeyword = '';
    this.statusFilter = '';
    this.fromDate = undefined;
    this.toDate = undefined;
    this.loadPayments(1, this.pageSize);
  }

  downloadTxnSlip(payment: PaymentResponse): void {
    if (!payment.paymentId) return;

    this.service.downloadTxnSlip(payment.paymentId).subscribe({
      next: blob => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = payment.txnSlipFileName || 'TxnSlip';
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: () => Swal.fire('Error', 'Unable to download file', 'error')
    });
  }

  export(type: string): void {
    if (type === 'pdf') {
      const el = document.querySelector('.table-responsive') as HTMLElement;
      if (!el) return;
      import('html2pdf.js').then(html2pdf => {
        html2pdf.default().from(el).save('Payment_Request_Report.pdf');
      });
    } else {
      this.isLoading = true;
      this.service.getAllPayments(0, 0, this.statusFilter, this.fromDate, this.toDate, '', 1)
        .subscribe({
          next: (res: PaginatedPaymentResponse) => {
            this.exportdataPayments = res.payments;
            import('xlsx').then(xlsx => {
              const worksheet = xlsx.utils.json_to_sheet(this.exportdataPayments);
              const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
              const ext = type === 'doc' ? 'xls' : type;
              const fileName = this.statusFilter === ''
                ? 'Payment_Request_Report'
                : `${this.statusFilter}_Payment_Request_Report`;
              xlsx.writeFile(workbook, `${fileName}.${ext}`);
            });
            this.isLoading = false;
          },
          error: () => (this.isLoading = false)
        });
    }
  }
}
