import { Component, signal, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import html2pdf from 'html2pdf.js';
import { LoaderComponent } from '../app-loader/loader.component';
import { OperatorService } from '../../services/operator.service';
import { HttpClient } from '@angular/common/http';
import { EncryptionService } from '../../encryption/encryption.service';
import { RechargeRequest } from '../../models/recharge.model';
import { RechargeService } from '../../services/recharge.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MasterService, ServiceStatusResponse } from '../../services/master.service';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { IQoreService } from '../../services/IQoreService.service';
import { UpcityService, District } from '../../services/UpcityService'



@Component({
  selector: 'app-Bill-Payment',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbTypeaheadModule, NgbToastModule, LoaderComponent, NgSelectModule],
  templateUrl: './Bill-Payment.component.html',
  styleUrls: ['./Bill-Payment.component.scss']
})
export class BillPaymentComponent {

  ngOnInit() {
    const userId = this.authServiceobj.getUserId();
    const userName = this.authServiceobj.getUsername();

    if (!userId || !userName) {
      Swal.fire('Validation', 'Session expired. Please login.', 'warning');
      this.router.navigate(['/login']);
      return;
    }

    this.BindCity();

    this.CheckServiceStatus(Number(userId), userName)
    this.loadOperatorsList();
  }

  BindCity() {
    this.upcityService.getDistricts().subscribe(
      data => {
        this.districts = data;
      },
      error => console.error('Error loading districts:', error)
    );
  }

  constructor(private modalservice: NgbModal, private masterService: MasterService, private router: Router, private authServiceobj: AuthService, private operatorService: OperatorService, private _IQoreService: IQoreService, private upcityService: UpcityService, private rechargeService: RechargeService, private toastr: ToastrService) { }

  isLoading = false;
  billpaymentStatus: string = 'SUCCESS';
  @ViewChild('billPopup') billPopup: any;
  @ViewChild('invoiceModal') invoiceModal: any;

  categories = [
    { label: 'Electricity', icon: 'bi-lightning', accountLabel: 'Account Number' },
    { label: 'Insurance Bill', icon: 'bi-bank', accountLabel: 'Policy Number' },
    { label: 'Fast Tag Bill Payment', icon: 'bi-credit-card', accountLabel: 'Vehicle No' },
    { label: 'Credit Card Bill Payment', icon: 'bi-credit-card', accountLabel: 'Credit Card No' }
  ];

  operators = [];
  operatorData = 'Electricity';
  selectedCategory = 'Electricity';
  selectedIcon = 'bi bi-lightning';
  accountLabel = 'Account Number';  // default
  accountNumber = '';
  mobileNumber = '';
  operator: any;
  city = '';
  amount = '';
  txnpin = '';
  CityVisible = false;
  customerName = 'Chandan';
  billNumber = '123456';
  reqId = '250913132929020';
  dueDate = '06-09-2025';
  billResponse: any;
  insuranceResponse: any;
  operatorList: any[] = [];
  email = '';
  dobDate: string = '';   // yyyy-MM-dd (from browser)
  dob: string = '';       // DD/MM/YYYY (for API)
  emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  districts: District[] = [];
  rechargeStatus = '';
  txnid = '';
  brid = '';
  transactiondatetime = '';

  onTabSelect(label: string) {
    const category = this.categories.find(c => c.label === label);
    if (category) {
      this.selectedCategory = category.label;
      this.selectedIcon = category.icon;
      this.accountLabel = category.accountLabel;
    }
    this.loadOperatorsList();
    this.BindCity();
    this.ResetForm();
  }

  loadOperatorsList() {
    this.isLoading = true;
    this.operatorData = this.selectedCategory === 'Electricity' ? 'BILLPAYMENT' : this.selectedCategory === 'Insurance Bill' ? 'Insurance' : 'fastag';
    this.operatorService.getOperators(this.operatorData).subscribe({
      next: (res) => {
        this.operatorList = res.map((op: any) => ({
          label: op.OperatorName,
          value: op.Spkey
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load operators', err);
        this.operatorList = [];
        this.isLoading = false;
      }
    });
  }

  generateReqId(): string {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const hh = now.getHours().toString().padStart(2, '0');
    const mi = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    const random = Math.floor(100 + Math.random() * 900); // 3 digits
    return `${yy}${mm}${dd}${hh}${mi}${ss}${ms}${random}`;
  }

  onOperatorChange(selectedValue: any): void {

    const cityOperators = [
      'UPPCL - Postpaid and Smart Prepaid Meter Recharge',
      'Torrent Power'
    ];

    if (cityOperators.includes(selectedValue.label)) {
      this.CityVisible = true;
    } else {
      this.CityVisible = false;
    }

  }

  CheckServiceStatus(userId: number, serviceName: string): void {
    this.masterService.checkServiceStatus("Bill Payment", userId).subscribe({
      next: (res: ServiceStatusResponse) => {
        console.log('Service Status Response:', res);
        const userType = this.authServiceobj.getUsertype();

        if (!res.userServiceActive || userType != 'Retailer') {

          Swal.fire({
            title: 'Attention!',
            text: "This is not valid page or You have not rights to access this page. Please contact to admin",
            icon: 'warning',
            confirmButtonColor: 'red'
          }).then(() => {
            this.router.navigate(['/dashboard']);
            return;
          });
        }

        if (!res.serviceActive) {
          Swal.fire({
            title: 'Attention!',
            text: "Bill Payment is down or not active. Please contact to admin",
            icon: 'warning',
            confirmButtonColor: 'red'
          }).then(() => {
            this.router.navigate(['/dashboard']);
            return;
          });
        }
      },
      error: (err) => {
        console.error('Error checking service status', err);
      }
    });
  }

  isEmailValid(): boolean {
    if (!this.email) return true; // Email is optional
    return this.emailRegex.test(this.email);
  }

  onDobChange() {
    if (!this.dobDate) {
      this.dob = '';
      return;
    }
    const [year, month, day] = this.dobDate.split('-');
    this.dob = `${day}/${month}/${year}`;
  }


  openBillPopup(modal: any) {
    if (this.selectedCategory === 'Electricity') {
      if (!this.accountNumber || !this.operator.value || !this.mobileNumber) {
        this.toastr.error('All fields are mandatory!');
        return;
      }
    }
    else if (this.selectedCategory === 'Insurance Bill') {

      if (!this.accountNumber || !this.operator.value || !this.mobileNumber || !this.dob) {
        this.toastr.error('Policy No, Mobile, Operator & DOB are mandatory!');
        return;
      }

      if (!this.isEmailValid()) {
        this.toastr.error('Please enter a valid email address!');
        return;
      }
    }
    else if (this.selectedCategory === 'Fast Tag Bill Payment') {
      if (!this.accountNumber || !this.operator.value || !this.mobileNumber) {
        this.toastr.error('All fields are mandatory!');
        return;
      }
    }
    else {
      if (!this.accountNumber || !this.mobileNumber || !this.operator.value || !this.amount) {
        this.toastr.error('All fields are mandatory!');
        return;
      }
    }

    let apiCall$;
    this.reqId = this.generateReqId();
    if (this.selectedCategory === 'Insurance Bill') {

      apiCall$ = this._IQoreService.fetchInsurance({
        cack: this.reqId,
        policyNumber: this.accountNumber,
        operator: this.operator.value,
        email: this.email,
        dob: this.dob,

      });
    }

    else if (this.selectedCategory === 'Fast Tag Bill Payment') {
      apiCall$ = this._IQoreService.fetchBill({
        cack: this.reqId,
        mobile: this.accountNumber,
        type: "fastag",
        operator: this.operator.value,
        optional: this.operator.value === "APFT" ? "30" : this.operator.value === "ABFT" ? "17" : this.operator.value === "BBFT" ? "13" : this.operator.value === "HBFT" ? "15" : this.operator.value === "IBFT" ? "14" : this.operator.value === "IDFT" ? "16" : this.operator.value === "IHFT" ? "11" : this.operator.value === "INFT" ? "12" : this.operator.value === "KMFT" ? "18" :
          this.operator.value === "EQFT" ? "19" : this.operator.value === "PMFT" ? "21" : this.operator.value === "JKFT" ? "22" : this.operator.value === "FBFT" ? "23" : this.operator.value === "IDFT" ? "24" : this.operator.value === "UCFT" ? "25" : this.operator.value === "TAFT" ? "26" :
            this.operator.value === "TAFT" ? "26" : this.operator.value === "IOFT" ? "27" : this.operator.value === "SBFT" ? "31" : this.operator.value === "TIFT" ? "28" : this.operator.value === "KBFT" ? "29" : this.operator.value === "BMFT" ? "34" : this.operator.value === "SIFT" ? "32" : this.operator.value === "SBFT" ? "33" :
              this.operator.value === "IBFT" ? "35" : this.operator.value === "LTFT" ? "36" : this.operator.value === "UBFT" ? "37" : this.operator.value === "CBFT" ? "38" : this.operator.value === "AUBFT" ? "39" : this.operator.value === "BBFT" ? "40" : ""
      });
    }

    else {
      if (this.operator.value === "TPEB" || this.operator.value === "UPSEB") {
        if (!this.city) {
          this.toastr.error('Please Select City Name!');
          return;
        }
      }

      apiCall$ = this._IQoreService.fetchBill({
        cack: this.reqId,
        mobile: this.accountNumber,
        optional: this.operator.value === "TPEB" || this.operator.value === "UPSEB" ? this.city : this.mobileNumber,
        operator: this.operator.value,
        type: "ebill"
      });
    }

    this.isLoading = true;

    apiCall$.subscribe({
      next: (res: any) => {

        if (!res?.rdata || res.rdata.length === 0) {
          this.toastr.error('No bill information found!');
          this.isLoading = false;
          return;
        }

        const billData = res.rdata[0];
        if (billData.status === 0) {
          this.toastr.info(billData.desc);
          this.isLoading = false;
          return;
        }
        this.customerName = billData.CustomerName || billData.customerName || 'NA';
        this.amount = billData.Billamount || billData.netamount || billData.billamount || '0';
        this.dueDate = billData.Duedate || billData.duedatefromto || billData.duedate || 'NA';
        this.billNumber = billData.BillNumber || res.mobile || 'NA';
        this.mobileNumber = this.mobileNumber;
        this.reqId = this.reqId;

        // 🔹 Open popup AFTER success
        this.modalservice.open(this.billPopup, {
          size: 'lg',
          backdrop: 'static',
          keyboard: false
        });
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to fetch bill details');

        this.isLoading = false;
      }
    });

    //this.modalservice.open(this.billPopup, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  confirmPayment() {
    if (!this.txnpin) {
      this.toastr.error('Please enter Txn Pin to proceed!');
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to pay this bill?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, please Pay',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#5e2f82',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {

        this.isLoading = true;

        if (!this.txnpin || this.txnpin.trim().length === 0) {
          this.isLoading = false;
          return;
        }
        const userId = this.authServiceobj.getUserId();
        const userName = this.authServiceobj.getUsername();

        if (!userId || !userName) {
          this.toastr.error('Session expired. Please login!');
          this.router.navigate(['/login']);
          return;
        }

        const payload: RechargeRequest = {
          UserId: Number(userId),
          userName: userName,
          MobileNumber: this.accountNumber,
          Operator: this.operator.label || '',
          operatorCode: this.operator.value || '',
          Amount: Number(this.amount)!,
          TxnPin: this.txnpin,
          Type: this.selectedCategory === 'Electricity' ? 'EBILL' : this.selectedCategory === 'Insurance Bill' ? 'INS' : this.selectedCategory === 'Fast Tag Bill Payment' ? 'FASTAG' : 'CCBP',
          CustomerRefNo: this.generateReqId(),
          optional: this.operator.value === "APFT" ? "30" : this.operator.value === "ABFT" ? "17" : this.operator.value === "BBFT" ? "13" : this.operator.value === "HBFT" ? "15" : this.operator.value === "IBFT" ? "14" : this.operator.value === "IDFT" ? "16" : this.operator.value === "IHFT" ? "11" : this.operator.value === "INFT" ? "12" : this.operator.value === "KMFT" ? "18" :
            this.operator.value === "EQFT" ? "19" : this.operator.value === "PMFT" ? "21" : this.operator.value === "JKFT" ? "22" : this.operator.value === "FBFT" ? "23" : this.operator.value === "IDFT" ? "24" : this.operator.value === "UCFT" ? "25" : this.operator.value === "TAFT" ? "26" :
              this.operator.value === "TAFT" ? "26" : this.operator.value === "IOFT" ? "27" : this.operator.value === "SBFT" ? "31" : this.operator.value === "TIFT" ? "28" : this.operator.value === "KBFT" ? "29" : this.operator.value === "BMFT" ? "34" : this.operator.value === "SIFT" ? "32" : this.operator.value === "SBFT" ? "33" :
                this.operator.value === "IBFT" ? "35" : this.operator.value === "LTFT" ? "36" : this.operator.value === "UBFT" ? "37" : this.operator.value === "CBFT" ? "38" : this.operator.value === "AUBFT" ? "39" : this.operator.value === "BBFT" ? "40" : this.operator.value === "TPEB" || this.operator.value === "UPSEB" ? this.city : this.mobileNumber
        };

        this.rechargeService.submitRecharge({ payload }).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.rechargeStatus = res.message;
            this.txnid = res.txnid;
            this.brid = res.apitxnid;
            this.transactiondatetime = res.transactiondatetime;

            if (res.success) {
              Swal.fire({
                title: 'Success',
                text: `Bill Payment Submitted for ${this.mobileNumber} | ₹${this.amount}`,
                icon: 'success',
                confirmButtonColor: '#5e2f82'
              })
              this.rechargeStatus = 'SUCCESS';
            } else if (
              (res.success == false && res.message === 'Invalid Transaction PIN') ||
              (res.success == false && res.message === 'Invalid User') ||
              (res.success == false && res.message === 'Invalid Operator') ||
              (res.success == false && res.message === 'Insufficient balance in wallet. Please add funds.')
            ) {
              this.toastr.error(res.message);
              return;
            } else {

              this.toastr.error(res.message || 'Bill Payment failed');
              return;
            }

            const modalRef = this.modalservice.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false });
            modalRef.closed.subscribe(() => window.location.reload());
            modalRef.dismissed.subscribe(() => window.location.reload());
          },
          error: () => {
            this.isLoading = false;
            this.toastr.error('API error. Try again later');
          }
        });
      }
    });



  }

  selectedTab(): string {
    return this.selectedCategory;
  }


  downloadInvoice() {
    this.isLoading = true;
    const original = document.getElementById('invoiceContent')!;
    const clone = original.cloneNode(true) as HTMLElement;

    const icon = clone.querySelector('.success-icon');
    if (icon) {
      icon.classList.add('no-animate');
    }
    html2pdf().set({
      margin: 0.2,
      filename: 'BillPayment_Invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(clone).save();
    this.isLoading = false;
  }

  get normalizedStatus(): string {
    return this.billpaymentStatus?.toUpperCase() || '';
  }

  get statusIcon(): string {
    switch (this.normalizedStatus) {
      case 'SUCCESS': return 'bi-check-circle-fill text-success';
      case 'FAILURE': return 'bi-x-circle-fill text-danger';
      default: return 'bi-hourglass-split text-warning';
    }
  }

  get statusMessage(): string {
    const tab = this.selectedCategory;
    switch (this.normalizedStatus) {
      case 'SUCCESS': return `${tab} Paid Successfully`;
      case 'FAILURE': return `${tab} Bill Failed`;
      default: return `${tab} Bill Pending`;
    }
  }

  ResetForm() {
    this.billpaymentStatus = 'SUCCESS';
    this.selectedCategory = 'Electricity';
    this.selectedIcon = 'bi bi-lightning';
    this.accountLabel = 'Account Number';
    this.accountNumber = '';
    this.mobileNumber = '';
    this.operator = '';
    this.amount = '';
    this.txnpin = '';
    this.city = '';
    this.CityVisible = false;
  }

  ClosePopup() {

    this.ResetForm();
    this.modalservice.dismissAll();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (this.accountLabel === 'Vehicle No') {
      return;
    }
    const charCode = event.which || event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  printInvoice() {
    const content = document.getElementById('invoiceContent');
    const printArea = document.getElementById('printArea');
    if (!content || !printArea) return;
    printArea.innerHTML = content.innerHTML;
    printArea.style.display = 'inline-block';
    window.print();
    setTimeout(() => {
      printArea.innerHTML = '';
      printArea.style.display = 'none';
    }, 500);
  }


}
