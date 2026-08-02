import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TxnReportUserPayload } from '../../models/TxnReport.model';
import { TxnReportService } from '../../services/Txn.report.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';
import { LoaderComponent } from '../app-loader/loader.component';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';

@Component({
  selector: 'app-usertxn-report',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule, ReactiveFormsModule, LoaderComponent, NgbTypeaheadModule, NgbToastModule],
  templateUrl: './UserTxnReport.component.html',
  styleUrl: './UserTxnReport.component.scss',
})
export class UserTxnReport implements OnInit {
  txnForm!: FormGroup;
  records: any[] = [];
  filteredRecords: any[] = [];
  exportrecords: any[] = [];
  totalRecords = 0;
  totalAmount = "0";
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  visiblePages: (number | null)[] = [];
  visibleColumns: string[] = [
    'Sr No', 'TXN_ID', 'Bank Name', 'BankRefNo', 'UserName', 'Amount', 'OperatorName',
    'AccountNo', 'Status', 'Update Status', 'Refund Or Failed', 'API Response',
    'TimeStamp', 'OpeningBal', 'Closing', 'APIName'
  ];
  searchKeyword: string = '';
  filters: any = {};
  isLoading = false;
  invoiceData: any = null;
  invoiceStatus: string = '';
  invoiceType: string = '';
  invoiceTitle: string = '';
  selectedRowIndex: number | null = null;

  services = ['All Service', 'RECHARGE', 'AEPS', 'MATM', 'DTH', 'BILL PAYMENT', 'Credit Card Bill', 'DMT', 'UPI', 'QR CODE', 'ONLINE PAYMENT', 'SETTLEMENT', 'LESSER REPORT'];
  users = [{ label: 'Anchal', value: 1 }, { label: 'Admin', value: 2 }];

  //Success Action Parameters
  txtTxnSuccessDet = '';
  SucessTxnId: number | null = null;
  SucessAccountNo = '';
  SucessServiceName = '';
  SucessUserId = '';
  SucessUserName = '';
  SucessCost: number | null = null;
  txtSuccessCurrentStatus = '';
  SucesstxtRemarks = '';
  //END

  //Refund And Failed Operation
  txnUpdateDisplay: string = '';
  txnTransId: number = 0;
  txnAccountNo: string = '';
  txnServiceName: string = '';
  txnUserId: number = 0;
  txnUserName: string = '';
  txnCost: number = 0;
  txnCurrentStatus: string = '';

  selectedTxnAction: string = 'FAILED';   // default action
  txnRemarks: string = '';                // common for both
  refundAmount: number = 0;               // only for REFUND
  refundPin: string = '';
  commonSearch: string = '';
  //END

  columnConfig: any = {
    'All Service': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'Operator Name', 'Account No', 'Customer No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'RECHARGE': ['Sr No', 'TXN ID', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'DTH': ['Sr No', 'TXN ID', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'BILL PAYMENT': ['Sr No', 'TXN ID', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'Credit Card Bill': ['Sr No', 'TXN ID', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'AEPS': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'Operator Name', 'Account No', 'Customer No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'MATM': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'DMT': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'Operator Name', 'Account No', 'Bene Name', 'Customer Mobile', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'UPI': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'QR CODE': ['Sr No', 'TXN ID', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'E-Invoice'],
    'ONLINE PAYMENT': ['Sr No', 'TXN ID', 'BankRefNo', 'Payment Id', 'Amount', 'Mobile No', 'Order Id', 'Aadhar No', 'PAN No', 'Name', 'Last 4 Digit Card No', 'Card Type', 'Status', 'TimeStamp', 'Updated Time'],
    'SETTLEMENT':  ['Sr No', 'Operator Name', 'TXN ID', 'Bank Name', 'IFSC Code', 'Account No', 'BankRefNo', 'Bene Name', 'Customer Mobile', 'Amount', 'Charge', 'Status', 'Coming From', 'TimeStamp', 'Updated Time'],
    'LESSER REPORT': ['Sr No', 'Opening Bal', 'Txn Amount', 'Commission/Charge', 'TDS', 'Closing',   'Status', 'TxnType', 'Remarks', 'TimeStamp', 'Updated Time'],
    'ADMIN LESSER REPORT': ['Sr No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time']
    
  };

  @ViewChild('successTxnModal') previewSuccessoperationmodel: any;
  @ViewChild('txnUpdateModal') previewtxnUpdatefailedorrefundModal: any;
  @ViewChild('invoiceModalRef') invoiceModalRef: any;

  selectRow(index: number): void {
    this.selectedRowIndex = index;
  }





  constructor(private fb: FormBuilder, private txnService: TxnReportService, private modalService: NgbModal, private _authservice: AuthService) { }
  formatDateLocal(date: Date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${yyyy}-${mm}-${dd}`; // format for input type="date"
  }
  ngOnInit(): void {
    const today = new Date();
    const fromDateObj = new Date();
    fromDateObj.setMonth(fromDateObj.getMonth() - 3);


    this.txnForm = this.fb.group({
      serviceType: ['All Service'],
      status: [''],
      dateFrom: [this.formatDateLocal(today)],
      dateTo: [this.formatDateLocal(today)],
      userId: [0],
    });

    this.updateVisibleColumns();
    this.loadData(this.currentPage, this.pageSize);
  }

  onSearch(): void {
    this.loadData(1, this.pageSize);
  }

  onReset(): void {
    const today = new Date();
    this.commonSearch = "";
    this.txnForm.reset({
      serviceType: 'All Service',
      status: '',
      dateFrom: this.formatDateLocal(today),
      dateTo: this.formatDateLocal(today),
      userId: this._authservice.getUserId(),
      userName: this._authservice.getUsername(),
    });
    this.onSearch();
  }

  onServiceChange(): void {
    this.updateVisibleColumns();
    this.filters = {};
    this.applyFilter();
    this.onSearch();
  }

  updateVisibleColumns(): void {
    const type = this.txnForm.value.serviceType;
    this.visibleColumns = this.columnConfig[type] || [];
  }

  loadData(pageIndex: number, pageSize: number): void {
    const payload: TxnReportUserPayload = {
      serviceType: this.txnForm.value.serviceType,
      status: this.txnForm.value.status,
      dateFrom: this.formatDate(this.txnForm.value.dateFrom),
      dateTo: this.formatDate(this.txnForm.value.dateTo),
      userId: Number(this._authservice.getUserId()),
      userName: this._authservice.getUsername(),
      commonsearch: this.commonSearch?.trim(),
      pageIndex,
      pageSize,
      ispaginationenabled: 1
    };

    this.isLoading = true;

    this.txnService.getUserTxnReport(payload).subscribe({
      next: (res: any) => {
        this.records = res.Data || [];
        this.totalRecords = res.TotalTransactions || 0;
        this.totalAmount = res.TotalAmount.toString();
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = pageIndex;
        this.updateVisiblePages();
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
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
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (this.currentPage > 4) {
        pages.push(null);
      }

      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (this.currentPage < this.totalPages - 3) {
        pages.push(null);
      }

      pages.push(this.totalPages);
    }

    this.visiblePages = pages;
  }

  applyFilter(): void {
    this.isLoading = true;
    const keyword = this.searchKeyword.toLowerCase();
    this.filteredRecords = this.records.filter(user =>
      user.TXN_ID?.toLowerCase().includes(keyword) ||
      user.BankRefNo?.toLowerCase().includes(keyword) ||
      user.UserName?.toLowerCase().includes(keyword) ||
      user.Amount?.toString().toLowerCase().includes(keyword) ||
      user.OperatorName?.toLowerCase().includes(keyword) ||
      user.AccountNo?.toLowerCase().includes(keyword) ||
      user.Status?.toLowerCase().includes(keyword) ||
      user.Success?.toString().toLowerCase().includes(keyword) ||
      user.Failed?.toString().toLowerCase().includes(keyword) ||
      user.OpeningBal?.toString().toLowerCase().includes(keyword) ||
      user.Closing?.toString().toLowerCase().includes(keyword) ||
      user.APIName?.toLowerCase().includes(keyword)
    );
    this.isLoading = false;
  }



  showFilter(col: string): boolean {
    const noFilterCols = ['Sr No', 'TimeStamp', 'Updated Time', 'Success', 'Failed', 'API Response'];
    return !noFilterCols.includes(col);
  }

  getTotalAmount(): number {
    return this.filteredRecords.reduce((acc, curr) => acc + (+curr.Amount || 0), 0);
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
      case 'Total Amount': return 'Amount';
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
      case 'Operator Name': return 'servicename';
      case 'Charge': return 'OperatorName';
      default: return col.replace(/\s+/g, '');
    }
  }



  openApiResponseModal(row: any) {
    alert(`API Response: ${JSON.stringify(row)}`);
  }

  export(type: string): void {
    if (type === 'pdf') {
      const el = document.querySelector('.table-responsive') as HTMLElement;
      if (!el) return;
      import('html2pdf.js').then(html2pdf => {
        html2pdf.default().from(el).save('Transaction_Report.pdf');
      });
    } else {

      this.isLoading = true;
      const FileName = this.txnForm.value.serviceType === 'LESSER REPORT' ? 'LESSAR Report' : this.txnForm.value.serviceType === 'ADMIN LESSER REPORT' ? 'ADMIN LESSER Report' : this.txnForm.value.serviceType + " " + 'Report';
      const payload: TxnReportUserPayload = {
        serviceType: this.txnForm.value.serviceType,
        status: this.txnForm.value.status,
        dateFrom: this.formatDate(this.txnForm.value.dateFrom),
        dateTo: this.formatDate(this.txnForm.value.dateTo),
        userId: Number(this._authservice.getUserId()),
        userName: this._authservice.getUsername(),
        commonsearch: this.commonSearch?.trim(),
        pageIndex: 0,
        pageSize: 0,
        ispaginationenabled: 0
      };
      this.txnService.getUserTxnReport(payload).subscribe({
        next: (res: any) => {
          this.exportrecords = res.Data || [];
          import('xlsx').then(xlsx => {
            const worksheet = xlsx.utils.json_to_sheet(this.exportrecords);
            const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
            const ext = type === 'doc' ? 'xls' : type;
            xlsx.writeFile(workbook, `${FileName}.${ext}`);
          });
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
    }
  }

  private formatDate(date: any): string {
    return new Date(date).toISOString().split('T')[0];
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
  openInvoiceModal(row: any) {
    this.invoiceData = row;
    this.invoiceData.TimeStamp = this.formatTimestamp(this.invoiceData.TimeStamp);
    // Map status to icon
    this.invoiceStatus = row.Status?.toUpperCase() == "SUCCESS" ? "Successful" : row.Status?.toUpperCase() == "FAILED" ? "Failed" : row.Status?.toUpperCase() == "PENDING" ? "Pending" : row.Status;

    if (['AEPS_CASH_WITHDRAWAL', 'CW'].includes(row.OperatorName)) {
      this.invoiceType = 'AEPS';
      this.invoiceTitle = "AEPS Cash Withdrawal Invoice";

    } else if (row.OperatorName === 'DMTTXN' || row.OperatorName === 'Money Transfer') {
      this.invoiceType = 'DMT';
      this.invoiceTitle = "Money Transfer Invoice";
    } else {
      return; // No invoice for other operators
    }

    this.modalService.open(this.invoiceModalRef, { size: 'lg', backdrop: 'static' });
  }


  printInvoice() {
    const content = document.getElementById('invoiceContent');
    const printArea = document.getElementById('printArea');

    if (!content || !printArea) return;

    // Clone content
    printArea.innerHTML = content.innerHTML;
    printArea.style.display = 'block';

    // ✅ TEMP FIX: slightly reduce height only during print
    const originalTransform = printArea.style.transform;

    printArea.style.transform = 'scale(0.98)';
    printArea.style.transformOrigin = 'top left';
    printArea.style.width = '102%';

    setTimeout(() => {
      window.print();
    }, 100);

    window.onafterprint = () => {
      // restore everything
      printArea.innerHTML = '';
      printArea.style.display = 'none';
      printArea.style.transform = originalTransform;
      printArea.style.width = '100%';
    };
  }


  downloadInvoice() {
    this.isLoading = true;
    const original = document.getElementById('invoiceContent')!;
    const clone = original.cloneNode(true) as HTMLElement;

    // Remove animation for PDF
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


}
