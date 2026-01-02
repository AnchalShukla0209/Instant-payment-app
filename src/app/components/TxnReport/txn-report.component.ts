import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TxnReportPayload } from '../../models/TxnReport.model';
import { TxnReportService } from '../../services/Txn.report.service';
import { MasterService, UserMasterDataForDD } from '../../services/master.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatePipe, CommonModule } from '@angular/common';
import { LoaderComponent } from '../app-loader/loader.component';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-txn-report',
  standalone: true,
  imports: [DatePipe, CommonModule, FormsModule, ReactiveFormsModule, LoaderComponent, NgbTypeaheadModule, NgbToastModule],
  templateUrl: './txn-report.component.html',
  styleUrl: './txn-report.component.scss',
})
export class TxnReportComponent implements OnInit {
  txnForm!: FormGroup;
  records: any[] = [];
  filteredRecords: any[] = [];
  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  visiblePages: (number | null)[] = [];
  visibleColumns: string[] = [
    'Sr No', 'TXN_ID', 'BankRefNo', 'UserName', 'Amount', 'OperatorName',
    'AccountNo', 'Status', 'Update Status', 'Refund Or Failed', 'API Response',
    'TimeStamp', 'OpeningBal', 'Closing', 'APIName'
  ];
  searchKeyword: string = '';
  filters: any = {};
  isLoading = false;

  services = ['All Service', 'Mobile Recharge', 'AEPS', 'MATM', 'DTH', 'ELECTRICITY', 'DMT', 'UPI', 'QR CODE', 'ONLINE PAYMENT', 'LESSER REPORT', 'ADMIN LESSER REPORT'];
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
  //END

  columnConfig: any = {
    'All Service': ['Sr No', 'TXN ID', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response'],
    'Mobile Recharge': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response'],
    'DTH': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response'],
    'ELECTRICITY': ['Sr No', 'TXN ID', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response'],
    'AEPS': ['Sr No', 'TXN ID', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response'],
    'MATM': ['Sr No', 'TXN ID', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response'],
    'DMT': ['Sr No', 'TXN ID', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response'],
    'UPI': ['Sr No', 'TXN ID', 'BankRefNo', 'User Name', 'Operator Name', 'Account No', 'Opening Bal', 'Amount', 'Closing', 'Status', 'APIName', 'Coming From', 'Master Distributor', 'Distributor', 'TimeStamp', 'Updated Time', 'Update Status', 'Refund Or Failed', 'API Response'],
    'QR CODE': ['Sr No', 'TXN ID', 'User Name', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'API Response'],
    'ONLINE PAYMENT': ['Sr No', 'TXN ID', 'User Name', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'API Response'],
    'LESSER REPORT': ['Sr No', 'User Name', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'API Response'],
    'ADMIN LESSER REPORT': ['Sr No', 'User Name', 'Opening Bal', 'Amount', 'Closing', 'Status', 'TimeStamp', 'Updated Time', 'API Response'],
  };

  @ViewChild('successTxnModal') previewSuccessoperationmodel: any;
  @ViewChild('txnUpdateModal') previewtxnUpdatefailedorrefundModal: any;


  constructor(private fb: FormBuilder, private txnService: TxnReportService, private modalService: NgbModal, private _MasterService: MasterService) { }

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
      dateFrom: [formatDateLocal(fromDateObj)],
      dateTo: [formatDateLocal(today)],
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
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      userId: 0,
    });
    this.onSearch();
  }

  onServiceChange(): void {
    const type = this.txnForm.value.serviceType;
    if(type=='LESSER REPORT')
    {
      this.loadUsers("RET");
    } 
    if(type=='ADMIN LESSER REPORT')
    {
      this.loadUsers("AD");
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
      pageIndex,
      pageSize,
    };

    this.isLoading = true;

    this.txnService.getTxnReport(payload).subscribe({
      next: (res: any) => {
        this.records = res.Data || [];
        this.totalRecords = res.TotalTransactions || 0;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = pageIndex;
        this.updateVisiblePages();
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
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
      case 'BankRefNo': return 'BankRefNo';
      case 'User Name': return 'UserName';
      case 'Operator Name': return 'OperatorName';
      case 'Account No': return 'AccountNo';
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
      default: return col.replace(/\s+/g, '');
    }
  }

  openSuccessModal(transId: number) {

    this.isLoading = true;

    this.txnService.getTxnSuccessDetails(transId).subscribe({
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
      text: 'Do you really want to update the status as Success?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#5e2f82',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;

        // Build payload just like your old jQuery version
        const payload = {
          Status: 'SUCCESS',
          Remarks: this.SucesstxtRemarks || '',
          TransId: this.SucessTxnId,
          UserId: this.SucessUserId,
          ServiceName: this.SucessServiceName,
          Amount: 0,
          AccountNo: this.SucessAccountNo,
          UserName: this.SucessUserName,
          TxnAmount: 0,
          TxnPin: ''   // always blank for Success
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
                this.SucesstxtRemarks = '';

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

  openFailedModal(transId: number) {

    this.isLoading = true;
    this.txnService.getTxnSuccessDetails(transId).subscribe({
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
          TxnPin: this.selectedTxnAction === 'REFUND' ? this.refundPin : ''
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
    if (type === 'pdf') {
      const el = document.querySelector('.table-responsive') as HTMLElement;
      if (!el) return;
      import('html2pdf.js').then(html2pdf => {
        html2pdf.default().from(el).save('Transaction_Report.pdf');
      });
    } else {
      import('xlsx').then(xlsx => {
        const worksheet = xlsx.utils.json_to_sheet(this.filteredRecords);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const ext = type === 'doc' ? 'xls' : type;
        xlsx.writeFile(workbook, `Transaction_Report.${ext}`);
      });
    }
  }

  private formatDate(date: any): string {
    return new Date(date).toISOString().split('T')[0];
  }
}
