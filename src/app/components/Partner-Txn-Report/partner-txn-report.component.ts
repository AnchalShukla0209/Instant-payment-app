import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbToastModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import html2pdf from 'html2pdf.js';
import { TxnReportPayload } from '../../models/TxnReport.model';
import { PartnerReportService, PartnerUserDropdownOption } from '../../services/partner-report.service';
import { LoaderComponent } from '../app-loader/loader.component';
import { PartnerShellComponent } from '../Partner-Shell/partner-shell.component';

/**
 * Distributor / Master Distributor downline transaction report - the partner equivalent of
 * the retailer `/UserTxnReports` page (same column set, filters, service-type branches and
 * per-row E-Invoice modal), but every row belongs to a user under the partner's own network,
 * not just "me". Scoping (Adid/Mdid membership) is enforced server-side by
 * `PartnerReportController` - never by client-side filtering. Reused for both
 * `/distributor/txn-report` and `/master-distributor/txn-report`.
 */
@Component({
  selector: 'app-partner-txn-report',
  standalone: true,
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoaderComponent,
    NgbTypeaheadModule,
    NgbToastModule,
    NgSelectModule,
    PartnerShellComponent
  ],
  templateUrl: './partner-txn-report.component.html',
  styleUrls: ['./partner-txn-report.component.scss']
})
export class PartnerTxnReportComponent implements OnInit {
  txnForm!: FormGroup;
  records: any[] = [];
  filteredRecords: any[] = [];
  exportrecords: any[] = [];
  totalRecords = 0;
  totalAmount = '0';
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  visiblePages: (number | null)[] = [];
  searchKeyword = '';
  commonSearch = '';
  isLoading = false;
  selectedRowIndex: number | null = null;

  invoiceData: any = null;
  invoiceStatus = '';
  invoiceType = '';
  invoiceTitle = '';

  @ViewChild('invoiceModalRef') invoiceModalRef: any;

  services = ['All Service', 'RECHARGE', 'AEPS', 'MATM', 'DTH', 'BILL PAYMENT', 'Credit Card Bill', 'DMT', 'UPI', 'QR CODE', 'ONLINE PAYMENT', 'SETTLEMENT', 'LESSER REPORT'];
  downlineUsers: PartnerUserDropdownOption[] = [{ id: 0, label: 'All Users' }];

  visibleColumns: string[] = [];
  columnConfig: any = {
    'All Service': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Customer No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'RECHARGE': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'DTH': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'BILL PAYMENT': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'Credit Card Bill': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'AEPS': ['Sr No', 'TXN ID', 'User Name', 'Bank Name', 'BankRefNo', 'Operator Name', 'Account No', 'Customer No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'MATM': ['Sr No', 'TXN ID', 'User Name', 'Bank Name', 'BankRefNo', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'DMT': ['Sr No', 'TXN ID', 'User Name', 'Bank Name', 'BankRefNo', 'Operator Name', 'Account No', 'Bene Name', 'Customer Mobile', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'UPI': ['Sr No', 'TXN ID', 'User Name', 'Bank Name', 'BankRefNo', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'QR CODE': ['Sr No', 'TXN ID', 'User Name', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'ONLINE PAYMENT': ['Sr No', 'TXN ID', 'User Name', 'BankRefNo', 'Payment Id', 'Amount', 'Mobile No', 'Order Id', 'Aadhar No', 'PAN No', 'Name', 'Last 4 Digit Card No', 'Card Type', 'Status', 'TimeStamp', 'Updated Time'],
    'SETTLEMENT': ['Sr No', 'User Name', 'Operator Name', 'TXN ID', 'Bank Name', 'IFSC Code', 'Account No', 'BankRefNo', 'Bene Name', 'Customer Mobile', 'Amount', 'Charge', 'Status', 'Coming From', 'TimeStamp', 'Updated Time'],
    'LESSER REPORT': ['Sr No', 'User Name', 'Opening Bal', 'Txn Amount', 'Commission/Charge', 'TDS', 'Closing', 'Status', 'TxnType', 'Remarks', 'TimeStamp', 'Updated Time']
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly reportService: PartnerReportService,
    private readonly modalService: NgbModal
  ) {}

  private formatDateLocal(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }

  ngOnInit(): void {
    const today = new Date();
    this.txnForm = this.fb.group({
      serviceType: ['All Service'],
      status: [''],
      dateFrom: [this.formatDateLocal(today)],
      dateTo: [this.formatDateLocal(today)],
      userId: [0]
    });

    this.updateVisibleColumns();
    this.loadDownlineUsers();
    this.loadData(this.currentPage, this.pageSize);
  }

  private loadDownlineUsers(): void {
    this.reportService.getUsersDropdown().subscribe({
      next: users => (this.downlineUsers = [{ id: 0, label: 'All Users' }, ...(users || [])]),
      error: () => (this.downlineUsers = [{ id: 0, label: 'All Users' }])
    });
  }

  onSearch(): void {
    this.loadData(1, this.pageSize);
  }

  onReset(): void {
    const today = new Date();
    this.commonSearch = '';
    this.txnForm.reset({
      serviceType: 'All Service',
      status: '',
      dateFrom: this.formatDateLocal(today),
      dateTo: this.formatDateLocal(today),
      userId: 0
    });
    this.updateVisibleColumns();
    this.onSearch();
  }

  onServiceChange(): void {
    this.updateVisibleColumns();
    this.onSearch();
  }

  updateVisibleColumns(): void {
    const type = this.txnForm.value.serviceType;
    this.visibleColumns = this.columnConfig[type] || [];
  }

  loadData(pageIndex: number, pageSize: number): void {
    const payload: TxnReportPayload = {
      serviceType: this.txnForm.value.serviceType,
      status: this.txnForm.value.status,
      dateFrom: this.formatDate(this.txnForm.value.dateFrom),
      dateTo: this.formatDate(this.txnForm.value.dateTo),
      userId: Number(this.txnForm.value.userId) || 0,
      commonsearch: this.commonSearch?.trim(),
      pageIndex,
      pageSize,
      ispaginationenabled: 1
    };

    this.isLoading = true;
    this.reportService.getTxnReport(payload).subscribe({
      next: (res: any) => {
        this.records = res.Data || [];
        this.filteredRecords = this.records;
        this.totalRecords = res.TotalTransactions || 0;
        this.totalAmount = (res.TotalAmount ?? 0).toString();
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = pageIndex;
        this.updateVisiblePages();
        this.isLoading = false;
      },
      error: () => (this.isLoading = false)
    });
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadData(1, this.pageSize);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadData(page, this.pageSize);
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

  getKey(col: string): string {
    switch (col) {
      case 'TXN ID': return 'TXN_ID';
      case 'Bank Name': return 'BankRefNo';
      case 'BankRefNo': return 'BRId';
      case 'User Name': return 'UserName';
      case 'Operator Name': return 'OperatorName';
      case 'Account No': return 'AccountNo';
      case 'Bene Name': return 'BeneName';
      case 'Customer Mobile': return 'CustomerMobile';
      case 'Customer No': return 'BeneName';
      case 'Opening Bal': return 'OpeningBal';
      case 'Amount': return 'Amount';
      case 'Closing': return 'Closing';
      case 'Status': return 'Status';
      case 'APIName': return 'APIName';
      case 'Coming From': return 'ComingFrom';
      case 'Master Distributor': return 'MasterDistributor';
      case 'Distributor': return 'Distributor';
      case 'TimeStamp': return 'TimeStamp';
      case 'Updated Time': return 'UpdatedTime';
      case 'API Response': return 'APIRes';
      case 'TxnType': return 'APIName';
      case 'Remarks': return 'APIRes';
      case 'Name': return 'OperatorName';
      case 'PAN No': return 'AccountNo';
      case 'Order Id': return 'BankRefNo';
      case 'Mobile No': return 'APIName';
      case 'Payment Id': return 'ComingFrom';
      case 'Aadhar No': return 'UserName';
      case 'Last 4 Digit Card No': return 'CustomerMobile';
      case 'Card Type': return 'BeneName';
      case 'Commission/Charge': return 'BeneName';
      case 'TDS': return 'CustomerMobile';
      case 'Txn Amount': return 'servicename';
      case 'IFSC Code': return 'Success';
      case 'Charge': return 'OperatorName';
      default: return col.replace(/\s+/g, '');
    }
  }

  showFilter(col: string): boolean {
    const noFilterCols = ['Sr No', 'TimeStamp', 'Updated Time', 'Success', 'Failed', 'API Response'];
    return !noFilterCols.includes(col);
  }

  formatTimestamp(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const h = d.getHours();
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd} ${hour}:${mm}:${ss} ${ampm}`;
  }

  openApiResponseModal(row: any): void {
    alert(`API Response: ${JSON.stringify(row)}`);
  }

  openInvoiceModal(row: any): void {
    this.invoiceData = { ...row };
    this.invoiceData.TimeStamp = this.formatTimestamp(this.invoiceData.TimeStamp);
    this.invoiceStatus = row.Status?.toUpperCase() === 'SUCCESS'
      ? 'Successful'
      : row.Status?.toUpperCase() === 'FAILED'
        ? 'Failed'
        : row.Status?.toUpperCase() === 'PENDING'
          ? 'Pending'
          : row.Status;

    if (['AEPS_CASH_WITHDRAWAL', 'CW'].includes(row.OperatorName)) {
      this.invoiceType = 'AEPS';
      this.invoiceTitle = 'AEPS Cash Withdrawal Invoice';
    } else if (row.OperatorName === 'DMTTXN' || row.OperatorName === 'Money Transfer') {
      this.invoiceType = 'DMT';
      this.invoiceTitle = 'Money Transfer Invoice';
    } else {
      return;
    }

    this.modalService.open(this.invoiceModalRef, { size: 'lg', backdrop: 'static' });
  }

  printInvoice(): void {
    const content = document.getElementById('invoiceContent');
    const printArea = document.getElementById('printArea');
    if (!content || !printArea) return;

    printArea.innerHTML = content.innerHTML;
    printArea.style.display = 'block';
    const originalTransform = printArea.style.transform;
    printArea.style.transform = 'scale(0.98)';
    printArea.style.transformOrigin = 'top left';
    printArea.style.width = '102%';

    setTimeout(() => window.print(), 100);

    window.onafterprint = () => {
      printArea.innerHTML = '';
      printArea.style.display = 'none';
      printArea.style.transform = originalTransform;
      printArea.style.width = '100%';
    };
  }

  downloadInvoice(): void {
    this.isLoading = true;
    const original = document.getElementById('invoiceContent')!;
    const clone = original.cloneNode(true) as HTMLElement;
    const icon = clone.querySelector('.success-icon');
    if (icon) {
      icon.classList.add('no-animate');
    }

    html2pdf().set({
      margin: 0.2,
      filename: 'E-Invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(clone).save();
    this.isLoading = false;
  }

  export(type: string): void {
    if (type === 'pdf') {
      const el = document.querySelector('.table-responsive') as HTMLElement;
      if (!el) return;
      import('html2pdf.js').then(html2pdfMod => {
        html2pdfMod.default().from(el).save('Downline_Transaction_Report.pdf');
      });
      return;
    }

    this.isLoading = true;
    const fileName = this.txnForm.value.serviceType === 'LESSER REPORT'
      ? 'Downline_Lesser_Report'
      : `Downline_${this.txnForm.value.serviceType}_Report`;

    const payload: TxnReportPayload = {
      serviceType: this.txnForm.value.serviceType,
      status: this.txnForm.value.status,
      dateFrom: this.formatDate(this.txnForm.value.dateFrom),
      dateTo: this.formatDate(this.txnForm.value.dateTo),
      userId: Number(this.txnForm.value.userId) || 0,
      commonsearch: this.commonSearch?.trim(),
      pageIndex: 0,
      pageSize: 0,
      ispaginationenabled: 0
    };

    this.reportService.getTxnReport(payload).subscribe({
      next: (res: any) => {
        this.exportrecords = res.Data || [];
        import('xlsx').then(xlsx => {
          const worksheet = xlsx.utils.json_to_sheet(this.exportrecords);
          const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
          const ext = type === 'doc' ? 'xls' : type;
          xlsx.writeFile(workbook, `${fileName}.${ext}`);
        });
        this.isLoading = false;
      },
      error: () => (this.isLoading = false)
    });
  }

  private formatDate(date: any): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
