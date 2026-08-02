import { Component, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'
import { AuthService } from '../../services/auth.service';
import { NotificationService, NotificationDto } from '../../services/notification.service';
import { DashboardService } from '../../services/dashboard.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { WalletBalance } from '../../models/DashboardData'
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UpiPaymentService } from '../../services/upi-payment.service';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { ToastrService } from 'ngx-toastr';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import html2pdf from 'html2pdf.js';
import { LoaderComponent } from '../../components/app-loader/loader.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe, ZXingScannerModule, NgbTypeaheadModule, NgbToastModule, LoaderComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(3px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-3px)' }))
      ])
    ])
  ]
})
export class HeaderComponent {
  walletBalance: WalletBalance | null = null;
  errorMessage = '';
  username = '';
  usertype = '';
  activeNotification?: NotificationDto;
  isVisible = true;
  balance = 12450;
  showBalance = false;
  amount = 100;
  customerName = '';
  mobileNo = '';
  emailId = '';
  paymentUrl = '';
  txnId = '';
  safeUrl = '';
  paymentStarted = false;
  paymentSuccess = false;
  interval: any;
  loading = false;
  isUpiPaymentVisible = false;
  nameInvalid = false;
  mobileInvalid = false;
  emailInvalid = false;
  amountInvalid = false;
  paymentTimer: any;
  showModal = false;
  isScanning = true;
  upiId: string = '';
  qramount: number = 0;
  usermpin: string = '';
  invoiceData: any = null;
  isLoading = false;
  qrpayname = '';

  constructor(private authService: AuthService, private notificationService: NotificationService, private _dashboardService: DashboardService, private _Route: Router, private _UpiPaymentService: UpiPaymentService, private toastr: ToastrService, private cd: ChangeDetectorRef, private modalService: NgbModal) { }

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.usertype = this.authService.getUsertype();
    console.log('Header loaded - Username:', this.username);
    this.loadActiveNotification();
  }

  @ViewChild('invoiceModal') invoiceModal: any;
  loadActiveNotification(): void {
    this.notificationService.getNotifications(1, 1000).subscribe(res => {
      this.activeNotification = res.items.find(n => n.status === 'Active');

    },);
  }
  dismissNotification(): void {
    this.isVisible = false;
  }

  viewDetails(): void {
    if (!this.activeNotification) return;
    alert(`Notification Details:\n\n${this.activeNotification.content}`);
  }

  toggleBalance() {
    this.fetchBalance()
  }

  fetchBalance() {

    if (this.authService.getUsertype() == "Retailer") {
      if (this.authService.getUserId() == "" || this.authService.getUsername() == "") {
        this._Route.navigate(['/login']);
        return;
      }
      this.errorMessage = '';
      const userId = this.authService.getUserId()
      const userName = this.authService.getUsername()
      this._dashboardService.getWalletBalance(Number(userId), userName).subscribe({
        next: (res) => {
          this.walletBalance = res;
          this.showBalance = !this.showBalance;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Failed to fetch wallet balance';

        }
      });
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this._Route.navigate(['/login']),
      error: () => this._Route.navigate(['/login'])
    });
  }

  openUPIPayment() {
    this.isUpiPaymentVisible = true;
  }

  openAddMoneyModal() {
    this.isUpiPaymentVisible = true;
  }

  closeUpiPaymentOutside(event: any) {
    if (event.target.classList.contains('modal')) {
      this.closeUpiPayment();
    }
  }


  closeUpiPayment() {
    this.isUpiPaymentVisible = false;
    this.paymentStarted = false;
    this.paymentSuccess = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.paymentTimer) {
      clearTimeout(this.paymentTimer);
    }
  }

  validatePayment(): boolean {

    this.nameInvalid = false;
    this.mobileInvalid = false;
    this.emailInvalid = false;
    this.amountInvalid = false;

    if (!this.customerName || this.customerName.trim().length < 3) {
      this.nameInvalid = true;
      this.cd.detectChanges();
      this.toastr.error('Enter valid name (minimum 3 characters)');
      setTimeout(() => document.getElementById('name')?.focus(), 100);
      return false;
    }

    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(this.customerName.trim())) {
      this.nameInvalid = true;
      this.cd.detectChanges();
      this.toastr.error('Name should contain only alphabets');
      setTimeout(() => document.getElementById('name')?.focus(), 100);
      return false;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!this.mobileNo || !mobileRegex.test(this.mobileNo)) {
      this.mobileInvalid = true;
      this.cd.detectChanges();
      this.toastr.error('Enter valid mobile number');
      setTimeout(() => document.getElementById('mobile')?.focus(), 100);
      return false;
    }

    // const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    // if (!this.emailId || !emailRegex.test(this.emailId)) {
    //   this.emailInvalid = true;
    //   this.cd.detectChanges();
    //   this.toastr.error('Enter valid email');
    //   setTimeout(() => document.getElementById('email')?.focus(), 100);
    //   return false;
    // }

    const amt = Number(this.amount);
    if (!this.amount || isNaN(amt) || amt < 10 || amt > 3000) {
      this.amountInvalid = true;
      this.cd.detectChanges();
      this.toastr.error('Enter amount between ₹10 and ₹3000');
      setTimeout(() => document.getElementById('amount')?.focus(), 100);
      return false;
    }

    return true;
  }


  initiateUPIPayment() {

    if (!this.validatePayment()) {
      return;
    }

    this.loading = true;
    const body = {
      APIKey: "InitiateUPIPayment001",
      SessionKey: this.authService.getSessionKey(),
      Amount: this.amount,
      MobileNo: this.mobileNo,
      EmailId: this.authService.getUserEmailId(),
      CustomerName: this.customerName
    };

    this._UpiPaymentService.initiatePayment(body).subscribe((res: any) => {

      this.loading = false;

      if (res.Status_Code == "1") {

        this.paymentUrl = res.Data;
        this.txnId = res.Message;
        this.paymentStarted = true;
        this.paymentSuccess = true;
        this.customerName = "";
        this.amount = 100;
        this.emailId = "";
        this.mobileNo = "";
        this.toastr.success("Payment Successful & Wallet Credited");

        // auto expire after 5 minutes
        this.paymentTimer = setTimeout(() => {

          if (!this.paymentSuccess) {
            clearInterval(this.interval);
            this.interval = null;

            this.paymentStarted = false;
            this.toastr.warning("QR expired. Please generate again.");
          }

        }, 300000); // 5 minutes
      }
      else {
        alert(res.Message);
      }

    });
  }

  allowOnlyNumber(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  allowOnlyText(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (!(charCode >= 65 && charCode <= 90) &&
      !(charCode >= 97 && charCode <= 122) &&
      charCode !== 32) {
      event.preventDefault();
    }
  }

  openScanner() {
    this.showModal = true;
    this.isScanning = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onCodeResult(result: string) {
    console.log('QR Result:', result);
    const match = result.match(/pa=([^&]+)/);
    if (match) {
      this.upiId = decodeURIComponent(match[1]);
      this.isScanning = false;
    }
  }

  payNow() {
    
    if (!this.upiId || !this.qramount || !this.usermpin || !this.qrpayname) {
      this.toastr.error("All fields are required");
      return;
    }

    if(!this.qrpayname)
    {
      this.toastr.error("Please Enter Beneficiary Name");
      return;
    }

    if (!/^[0-9]{4}$/.test(this.usermpin)) {
      this.toastr.error("Invalid MPIN");
      return;
    }

    const amount = Number(this.qramount);

    if (amount < 100 || amount > 25000) {
      this.toastr.error("Amount must be between 100 and 25000");
      return;
    }

    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(this.upiId)) {
      this.toastr.error("Invalid UPI ID");
      return;
    }
    this.isLoading = true;
    const payload = {
      SessionKey: this.authService.getSessionKey(),
      APIKey: "UPIMoneyTransfer001",
      Sendermobile: this.authService.getUserPhoneNo(),
      BeneName: this.qrpayname,
      AccountNo: this.upiId,
      IfscCode: "",
      BeneId: "1",
      Amount: amount,
      BankName: "UPI",
      MPIN: this.usermpin,
      SenderName: this.authService.getUsername()
    };

    this._UpiPaymentService.initiateUPIPayment(payload).subscribe((res: any) => {
      if (res.Status_Code === "1") {
        this.toastr.success("Payment Successful");
        this.qramount = 0;
        this.upiId = '';
        this.usermpin = '';
        this.qrpayname ='';
        this.invoiceData = {
          AccountNo: res?.Data[0]?.AccountNo,
          Amount: res?.Data[0]?.Amount,
          Status: res?.Data[0]?.Status,
          TxnDate: res?.Data[0]?.TxnDate,
          TxnID: res?.Data[0]?.TxnID
        };
        this.closeModal();
        this.modalService.open(this.invoiceModal, {
          size: 'lg',
          backdrop: 'static',
          keyboard: false
        });
        this.isLoading = false;
      }
      else {
        this.toastr.error(res.Message);
        this.isLoading = false;
      }

    }, err => {
      alert("Server Error");
      this.isLoading = false;
    });
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
      filename: 'UPI_Invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(clone).save();
    this.isLoading = false;
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
