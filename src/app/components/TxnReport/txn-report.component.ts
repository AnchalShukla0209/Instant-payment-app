import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TxnReportPayload } from '../../models/TxnReport.model';
import { TxnReportService } from '../../services/Txn.report.service';
import { MasterService, UserMasterDataForDD } from '../../services/master.service';
import { AuthService } from '../../services/auth.service';
import { MoneyTransferService } from '../../services/money-transfer.service';
import { AEPSService } from '../../services/aeps.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';
import { LoaderComponent } from '../app-loader/loader.component';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-txn-report',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule, ReactiveFormsModule, LoaderComponent, NgbTypeaheadModule, NgbToastModule, NgSelectModule],
  templateUrl: './txn-report.component.html',
  styleUrl: './txn-report.component.scss',
})
export class TxnReportComponent implements OnInit {
  txnForm!: FormGroup;
  records: any[] = [];
  exportrecords: any[] = [];
  filteredRecords: any[] = [];
  totalRecords = 0;
  totalAmount = "0";
  totalPages = 0;
  currentPage = 1;
  pageSize = 15;
  transId: number = 0;
  RRN: string = '';
  visiblePages: (number | null)[] = [];
  visibleColumns: string[] = [
    'Sr No', 'TXN_ID', 'BankRefNo', 'UserName', 'Amount', 'OperatorName',
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
  services = ['All Service', 'RECHARGE', 'AEPS', 'MATM', 'DTH', 'BILL PAYMENT', 'Credit Card Bill', 'DMT', 'UPI', 'QR CODE', 'ONLINE PAYMENT', 'SETTLEMENT', 'LESSER REPORT', 'ADMIN LESSER REPORT', 'SUPERADMIN LESSER REPORT'];
  users: { label: string; value: number }[] = [];


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

  txnPin: string = '';

  columnConfig: any = {
    'All Service': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response', 'E-Invoice', 'Check Status'],
    'RECHARGE': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response', 'E-Invoice', 'Check Status'],
    'DTH': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response', 'E-Invoice', 'Check Status'],
    'BILL PAYMENT': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response', 'E-Invoice', 'Check Status'],
    'Credit Card Bill': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response', 'E-Invoice', 'Check Status'],
    'AEPS': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response', 'E-Invoice', 'Check Status'],
    'MATM': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response', 'E-Invoice', 'Check Status'],
    'DMT': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'User Name', 'Operator Name', 'Bene Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response', 'E-Invoice', 'Check Status'],
    'UPI': ['Sr No', 'TXN ID', 'Bank Name', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response', 'E-Invoice', 'Check Status'],
    'QR CODE': ['Sr No', 'TXN ID', 'User Name', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'API Response', 'Update Status', 'E-Invoice', 'Check Status'],
    'ONLINE PAYMENT': ['Sr No', 'TXN ID', 'BankRefNo', 'User Name', 'Payment Id', 'Amount', 'Mobile No', 'Order Id', 'Aadhar No', 'PAN No', 'Name', 'Last 4 Digit Card No', 'Card Type', 'Status', 'TimeStamp', 'Updated Time', 'API Response', 'Update Status'],
    'SETTLEMENT':  ['Sr No', 'User Name', 'Operator Name','TXN ID', 'Bank Name', 'IFSC Code', 'Account No', 'BankRefNo', 'Bene Name', 'Customer Mobile', 'Amount', 'Charge', 'Status', 'Coming From', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response','Check Status' ],
    'LESSER REPORT': ['Sr No', 'User Name', 'Opening Bal', 'Txn Amount', 'Commission/Charge', 'TDS', 'Closing', 'Status', 'Remarks', 'TimeStamp', 'Updated Time', 'API Response'],
    'ADMIN LESSER REPORT': ['Sr No', 'User Name', 'Opening Bal', 'Amount', 'Closing', 'Status', 'Remarks', 'TimeStamp', 'Updated Time', 'API Response'],
    'SUPERADMIN LESSER REPORT': ['Sr No', 'User Name', 'Opening Bal', 'Amount', 'Closing', 'Status', 'Remarks', 'TimeStamp', 'Updated Time', 'API Response'],
  };


  @ViewChild('successTxnModal') previewSuccessoperationmodel: any;
  @ViewChild('txnUpdateModal') previewtxnUpdatefailedorrefundModal: any;
  @ViewChild('invoiceModalRef') invoiceModalRef: any;

  selectRow(index: number): void {
    this.selectedRowIndex = index;
  }

  constructor(private fb: FormBuilder, private txnService: TxnReportService, private modalService: NgbModal, private _MasterService: MasterService, private _authservice: AuthService, private _moneyTransferService: MoneyTransferService, private aepsService: AEPSService) { }

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
    this.loadUsers('RET');
    function formatDateLocal(date: Date) {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${yyyy}-${mm}-${dd}`; // format for input type="date"
    }
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

  loadUsers(mode: string) {
    this.isLoading = true;
    this.users = []; // clear users before loading new ones

    this._MasterService.getUsers(mode).subscribe({
      next: (data: UserMasterDataForDD[]) => {
        this.users = data.map(u => ({
          label: u.name,
          value: u.id
        }));
        this.isLoading = false;
      },
      error: err => {
        console.error('Error loading users', err);
        this.isLoading = false;
      }
    });
  }


  onSearch(): void {
    this.loadData(1, this.pageSize);
  }

  onReset(): void {
    const today = new Date();
    const fromDate = new Date(today.setMonth(today.getMonth() - 3));
    this.txnForm.reset({
      serviceType: 'All Service',
      status: '',
      dateFrom: this.formatDateLocal(today),
      dateTo: this.formatDateLocal(today),
      userId: 0,
    });
    this.onSearch();
  }

  onServiceChange(): void {
    const type = this.txnForm.value.serviceType;
    if (type == 'LESSER REPORT') {
      this.loadUsers("RET");
    }
    if (type == 'ADMIN LESSER REPORT') {
      this.loadUsers("AD");
    }
    if (type == 'SUPERADMIN LESSER REPORT') {
      this.loadUsers("SA");
    }
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
    const payload: TxnReportPayload = {
      serviceType: this.txnForm.value.serviceType,
      status: this.txnForm.value.status,
      dateFrom: this.formatDate(this.txnForm.value.dateFrom),
      dateTo: this.formatDate(this.txnForm.value.dateTo),
      userId: Number(this.txnForm.value.userId),
      commonsearch: this.commonSearch?.trim(),
      pageIndex,
      pageSize,
      ispaginationenabled: 1
    };

    this.isLoading = true;

    this.txnService.getTxnReport(payload).subscribe({
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
      user.APIName?.toLowerCase().includes(keyword) ||
      user.servicename?.toLowerCase().includes(keyword)

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
      case 'Aadhar No': return 'Transactionid';
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

  openSuccessModal(data: any, servicename: string) {

    this.isLoading = true;
    this.transId = data.servicename == "RAZORPAY" || data.servicename == "QR CODE" || data.servicename == "SettlementAEPS"  || data.servicename == "SettlementRazorpay" || data.servicename == "SettlementMATM" ? data.Id : Number(data.TXN_ID);
    this.txnService.getTxnSuccessDetails(this.transId, servicename).subscribe({
      next: (res: any) => {
        console.log('API Response:', res);

        this.txtTxnSuccessDet = `${res.serviceName}/${res.accountNo}`;
        this.SucessTxnId = res.transId;
        this.SucessAccountNo = res.accountNo;
        this.SucessServiceName = res.serviceName;
        this.SucessUserId = res.userId;
        this.SucessUserName = res.userName;
        this.SucessCost = res.cost;
        this.txtSuccessCurrentStatus = res.status;
        this.SucesstxtRemarks = '';
        this.isLoading = false;
        this.modalService.open(this.previewSuccessoperationmodel, { size: 'lg', backdrop: 'static', keyboard: false });
      },
      error: (err) => {
        console.error('Error fetching Success Txn details', err);
        this.isLoading = false;
      }
    });

  }

  successAction() {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to update the status as ${this.selectedTxnAction}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#5e2f82',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {


        if (!this.txnPin?.trim()) {
          Swal.fire('Validation Error', 'Txn Pin is required for this action.', 'warning');
          return;
        }

        if (!this.RRN?.trim() && this.selectedTxnAction.toUpperCase() == "SUCCESS") {
          Swal.fire('Validation Error', 'RRN is required for this action.', 'warning');
          return;
        }
        if (!this.SucesstxtRemarks?.trim()) {
          Swal.fire('Validation Error', 'Remarks are required for this action.', 'warning');
          return;
        }
        this.isLoading = true;
        // Build payload just like your old jQuery version
        const payload = {
          Status: this.selectedTxnAction,
          Remarks: this.SucesstxtRemarks || '',
          TransId: this.SucessTxnId,
          UserId: this.SucessUserId,
          ServiceName: this.SucessServiceName,
          Amount: this.SucessCost,
          AccountNo: this.RRN,
          UserName: this.SucessUserName,
          TxnAmount: 0,
          TxnPin: this.txnPin
        };

        this.txnService.getUpdateTxnStatus(payload).subscribe({
          next: (res: any) => {
            this.isLoading = false;

            if (res.flag) {
              Swal.fire({
                title: 'Updated!',
                text: res.errorMsg,
                icon: 'success',
                confirmButtonColor: '#5e2f82'
              }).then(() => {
                // Clear form values
                this.txtTxnSuccessDet = '';
                this.SucessTxnId = 0;
                this.SucessAccountNo = '';
                this.SucessServiceName = '';
                this.SucessUserId = '0';
                this.SucessUserName = '';
                this.txtSuccessCurrentStatus = '';
                this.selectedTxnAction = 'FAILED';
                this.SucesstxtRemarks = '';
                this.txnPin = '';
                this.RRN = '';

                // Close modal
                this.modalService.dismissAll();

                // Reload transactions
                this.onSearch();
              });
            } else {
              Swal.fire({
                title: 'Update Failed',
                text: res.errorMsg,
                icon: 'error',
                confirmButtonColor: '#dc3545'
              });
            }
          },
          error: (err) => {
            this.isLoading = false;
            Swal.fire({
              title: 'Error',
              text: 'Error updating transaction. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc3545'
            });
            console.error('Error in SuccessAction:', err);
          }
        });
      }
    });
  }

  openFailedModal(data: any, servicename: string) {

    this.isLoading = true;
    this.transId = servicename == "RAZORPAY" || servicename == "QR CODE" || servicename == "SettlementAEPS"  || servicename == "SettlementRazorpay" || servicename == "SettlementMATM" ? data.Id : Number(data.TXN_ID);
    this.txnService.getTxnSuccessDetails(this.transId, servicename).subscribe({
      next: (res: any) => {
        this.txnUpdateDisplay = `${res.serviceName}/${res.accountNo}`;
        this.txnTransId = res.transId;
        this.txnAccountNo = res.accountNo;
        this.txnServiceName = res.serviceName;
        this.txnUserId = res.userId;
        this.txnUserName = res.userName;
        this.txnCost = res.cost;
        this.txnCurrentStatus = res.status;

        // reset fields
        this.txnRemarks = '';
        this.selectedTxnAction = 'FAILED';
        this.refundAmount = res.cost || 0;
        this.refundPin = '';

        this.isLoading = false;
        this.modalService.open(this.previewtxnUpdatefailedorrefundModal, { size: 'lg', backdrop: 'static', keyboard: false });
      },
      error: (err) => {
        console.error('Error fetching txn details', err);
        this.isLoading = false;
      }
    });

  }

  submitTxnUpdate() {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to update the status as ${this.selectedTxnAction}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#5e2f82',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        // ---- Validation ----
        if (this.selectedTxnAction === 'FAILED' && !this.txnRemarks?.trim()) {
          Swal.fire('Validation Error', 'Remarks are required for FAILED action.', 'warning');
          return;
        }
        if (this.selectedTxnAction === 'REFUND') {
          if (!this.refundPin?.trim()) {
            Swal.fire('Validation Error', 'Refund Pin is required for REFUND action.', 'warning');
            return;
          }
          if (!this.txnRemarks?.trim()) {
            Swal.fire('Validation Error', 'Remarks are required for REFUND action.', 'warning');
            return;
          }
        }

        this.isLoading = true;

        // ---- Build payload ----
        const payload = {
          Status: this.selectedTxnAction,
          Remarks: this.txnRemarks,
          TransId: this.txnTransId,
          UserId: this.txnUserId,
          ServiceName: this.txnServiceName,
          Amount: this.selectedTxnAction === 'REFUND' ? this.refundAmount : 0,
          AccountNo: this.txnAccountNo,
          UserName: this.txnUserName,
          TxnAmount: this.selectedTxnAction === 'REFUND' ? this.refundAmount : 0,
          TxnPin: this.selectedTxnAction === 'REFUND' ? this.refundPin : this.txnPin
        };

        // ---- API call ----
        this.txnService.getUpdateTxnStatus(payload).subscribe({
          next: (res: any) => {
            this.isLoading = false;

            if (res.flag) {
              Swal.fire({
                title: 'Updated!',
                text: res.errorMsg,
                icon: 'success',
                confirmButtonColor: '#5e2f82'
              }).then(() => {
                // Reset fields
                this.txnTransId = 0;
                this.txnAccountNo = '';
                this.txnServiceName = '';
                this.txnUserId = 0;
                this.txnUserName = '';
                this.txnCost = 0;
                this.txnCurrentStatus = '';
                this.txnRemarks = '';
                this.refundAmount = 0;
                this.refundPin = '';
                this.selectedTxnAction = 'FAILED';
                this.txnPin = '';

                // Close modal
                this.modalService.dismissAll();

                // Reload grid/list
                this.onSearch();
              });
            } else {
              Swal.fire({
                title: 'Update Failed',
                text: res.errorMsg,
                icon: 'error',
                confirmButtonColor: '#dc3545'
              });
            }
          },
          error: (err) => {
            this.isLoading = false;
            Swal.fire({
              title: 'Error',
              text: 'Error updating transaction. Please try again.',
              icon: 'error',
              confirmButtonColor: '#dc3545'
            });
            console.error('Error in submitTxnUpdate:', err);
          }
        });
      }
    });
  }


  openApiResponseModal(row: any) {
    alert(`API Response: ${JSON.stringify(row)}`);
  }

  export(type: string): void {
    const payload: TxnReportPayload = {
      serviceType: this.txnForm.value.serviceType,
      status: this.txnForm.value.status,
      dateFrom: this.formatDate(this.txnForm.value.dateFrom),
      dateTo: this.formatDate(this.txnForm.value.dateTo),
      userId: Number(this.txnForm.value.userId),
      commonsearch: this.commonSearch?.trim(),
      pageIndex: 0,
      pageSize: 0,
      ispaginationenabled: 0
    };
    this.isLoading = true;
    const FileName = this.txnForm.value.serviceType === 'LESSER REPORT'? 'LESSAR Report': this.txnForm.value.serviceType === 'ADMIN LESSER REPORT' ? 'ADMIN LESSER Report' : this.txnForm.value.serviceType + " "+'Report';
    
    this.txnService.getTxnReport(payload).subscribe({
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
    this.invoiceStatus = row.Status?.toUpperCase();

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

  checkDMTStatus(row: any) {
    if (!row.Transactionid) {
      Swal.fire('Validation Error', 'TxnId is required!', 'warning');
      return;
    }

    this.isLoading = true;

    const request$ = row.APIName === 'FZP'
      ? this._moneyTransferService.CheckStatusFZPMoneyTransfer(row.Transactionid)
      : row.APIName === 'ARP'
      ? this._moneyTransferService.CheckStatusARPMoneyTransfer(row.Transactionid)
      : row.APIName === 'RKIT'
      ? this._moneyTransferService.CheckStatusRKITMoneyTransfer(row.Transactionid)
      : row.APIName === 'Settlement'
      ? this._moneyTransferService.CheckStatusARPMoneyTransfer(row.TXN_ID) :
       this._moneyTransferService.CheckStatusNifiMoneyTransfer(row.Transactionid);

    request$.subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status_Code === "1") {
          Swal.fire('Success', res.message || 'Transaction status retrieved successfully!', 'success');
          this.loadData(1, this.pageSize);
        } else if (res.data && res.data.length > 0) {
          const txn = res.data[0];
          Swal.fire('Transaction Status', `Status: ${txn.status || res.message}\nTxn ID: ${txn.txnID || ''}\nAmount: ₹${txn.amount || ''}`, 'info');
          this.loadData(1, this.pageSize);
        } else {
          Swal.fire('Warning', res.message || 'Transaction not found or already processed', 'warning');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        Swal.fire('Error', 'Server Error. Please try again.', 'error');
        console.error('Error checking DMT status:', err);
      }
    });
  }

  checkFinoAepsStatus(row: any) {
    if (!row.Transactionid) {
      Swal.fire('Validation Error', 'TxnId is required!', 'warning');
      return;
    }

    const userId = this._authservice.getUserId();
    if (!userId) {
      Swal.fire('Session Error', 'Please login again', 'error');
      return;
    }

    this.isLoading = true;
    const payload = {
      userid: userId,
      APIKey: 'FinoAEPS001',
      ClientRefID: row.Transactionid
    };

    this.aepsService.checkTransactionStatus(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.Status_Code === '1') {
          Swal.fire('Success', res?.Message || 'Transaction status checked successfully!', 'success');
          this.loadData(1, this.pageSize);
        } else {
          Swal.fire('Warning', res?.Message || 'Unable to check status', 'warning');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        Swal.fire('Error', 'Server Error. Please try again.', 'error');
        console.error('Error checking FINO AEPS status:', err);
      }
    });
  }

  printInvoice() {
    const content = document.getElementById('invoiceContent');
    const printArea = document.getElementById('printArea');

    if (!content || !printArea) return;

    // Clone ONLY the invoice
    printArea.innerHTML = content.innerHTML;

    // Show print area
    printArea.style.display = 'inline-block';

    // Trigger print
    window.print();

    // Cleanup after print
    setTimeout(() => {
      printArea.innerHTML = '';
      printArea.style.display = 'none';
    }, 500);
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
