import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { PaymentService } from '../../services/payment.service';
import { PaymentResponse, PaymentUpdateRequest, PaginatedPaymentResponse } from '../../models/payment-request.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../app-loader/loader.component';

@Component({
  selector: 'app-payment-request-admin-list',
  standalone: true,
  imports: [FormsModule, CommonModule, LoaderComponent],
  templateUrl: './payment-request-admin.component.html',
  styleUrls: ['./payment-request-admin.component.scss']
})
export class PaymentRequestAdminComponent implements OnInit {

  payments: PaymentResponse[] = [];
  paginatedPayments: PaymentResponse[] = [];
  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  searchKeyword = '';
  isLoading = false;
  visiblePages: (number | null)[] = [];

  selectedPayment: PaymentResponse | null = null;
  actionType: 'Approve' | 'Reject' | null= null;
  remarks: string = '';
  @ViewChild('paymentModalRef') paymentModalRef: any;

  fromDate?: Date;
  toDate?: Date;
  statusFilter?: string='';

  constructor(private service: PaymentService, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.loadPayments(this.currentPage, this.pageSize);
  }

  loadPayments(pageIndex: number, pageSize: number): void {
    this.isLoading = true;
    this.service.getAllPayments(pageIndex, pageSize, this.statusFilter, this.fromDate, this.toDate)
      .subscribe({
        next: (res: PaginatedPaymentResponse) => {
          this.payments = res.payments;
          this.totalRecords = res.totalCount;
          this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
          this.currentPage = pageIndex;
          this.updateVisiblePages();
          this.applyFilter();
          this.isLoading = false;
        },
        error: () => this.isLoading = false
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

  applyFilter(): void {
    const keyword = this.searchKeyword.toLowerCase();
    this.paginatedPayments = this.payments.filter(p =>
      p.userName?.toLowerCase().includes(keyword) ||
      p.txnId?.toLowerCase().includes(keyword) ||
      p.status?.toLowerCase().includes(keyword) ||
      p.bankName?.toLowerCase().includes(keyword)
    );
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadPayments(page, this.pageSize);
  }

  openModal(content: any, payment: PaymentResponse, action: 'Approve' | 'Reject'): void {
    this.isLoading = true;
    this.service.getPaymentById(payment.paymentId).subscribe({
      next: (res) => {
        this.selectedPayment = res;
        this.actionType = action;
        this.remarks = '';
        this.modalService.open(this.paymentModalRef, { size: 'lg', backdrop: 'static', keyboard: false });
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  confirmAction(): void {
    if (!this.selectedPayment || !this.actionType) return;

    if (this.actionType === 'Reject' && !this.remarks.trim()) {
      Swal.fire('Validation', 'Remarks are mandatory when rejecting', 'warning');
      return;
    }

    Swal.fire({
      title: `${this.actionType} Payment`,
      text: `Are you sure you want to ${this.actionType.toLowerCase()} this payment?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const updateRequest: PaymentUpdateRequest = {
          paymentId: this.selectedPayment!.paymentId,
          status: this.actionType === 'Approve' ? 'Approved' : 'Rejected',
          adminRemarks: this.actionType === 'Approve' ?'':this.remarks.trim(),
          modifiedBy: 1 
        };

        this.service.updatePayment(updateRequest).subscribe({
          next: () => {
            Swal.fire('Success', `Payment ${this.actionType!=null?this.actionType.toLowerCase():''}ed successfully`, 'success');
            this.modalService.dismissAll();
            this.loadPayments(this.currentPage, this.pageSize);
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'Something went wrong', 'error')
        });
      }
    });
  }

  downloadTxnSlip(payment: PaymentResponse): void {
    if (!payment.paymentId) return;

    this.service.downloadTxnSlip(payment.paymentId).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = payment.txnSlipFileName || 'TxnSlip';
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => Swal.fire('Error', 'Unable to download file', 'error')
    });
  }

  resetFilters(): void {
    this.searchKeyword = '';
    this.statusFilter = '';
    this.fromDate = undefined;
    this.toDate = undefined;
    this.loadPayments(1, this.pageSize);
  }

  export(type: string): void {
    if (type === 'pdf') {
      const el = document.querySelector('.table-responsive') as HTMLElement;
      if (!el) return;
      import('html2pdf.js').then(html2pdf => {
        html2pdf.default().from(el).save('Transaction_Report.pdf');
      });
    } else {
      import('xlsx').then(xlsx => {
        const worksheet = xlsx.utils.json_to_sheet(this.paginatedPayments);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const ext = type === 'doc' ? 'xls' : type;
        xlsx.writeFile(workbook, `Transaction_Report.${ext}`);
      });
    }
  }

}
