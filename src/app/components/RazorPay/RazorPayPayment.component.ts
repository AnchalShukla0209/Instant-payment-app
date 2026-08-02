import { Component, signal, ViewChild, inject, NgZone, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import html2pdf from 'html2pdf.js';
import { LoaderComponent } from '../app-loader/loader.component';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PanService } from '../../services/PANVerify/Pan.service';
import { AuthService } from '../../services/auth.service';
import { RazorpayService } from '../../services/RazorPay/razorpay.service';
declare var Razorpay: any;
@Component({
  selector: 'app-RazorPayPayment',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTypeaheadModule, NgbToastModule, LoaderComponent],
  templateUrl: './RazorPayPayment.component.html',
  styleUrls: ['./RazorPayPayment.component.scss']
})
export class RazorPayPaymentComponent {
  @ViewChild('invoiceModal') invoiceModal: any;
  constructor(private modalService: NgbModal, private toastr: ToastrService, private fb: FormBuilder, private zone: NgZone) { }
  private panService = inject(PanService);
  private authServiceobj = inject(AuthService);
  private router = inject(Router);
  private razorpayService = inject(RazorpayService);
  selectedicon: string = '';
  showRecentTxns = false;
  amount: any = null;
  dailyLoginForm!: FormGroup;
  sessionKey: string = "Ue3+U37PTedaLzeWuzX+DGJQJL3nGv5pPO+K3dVOrWU=";
  invoiceData: any = null;
  latitude: string = '';
  longitude: string = '';
  errorMessage: string = '';
  timeout: any;

  async ngOnInit() {
    this.isLoading = true;
    this.sessionKey = this.authServiceobj.getSessionKey();
    const userId = this.authServiceobj.getUserId();
    const userName = this.authServiceobj.getUsername();

    if (!userId || !userName) {
      this.toastr.error('Session expired. Please login.');
      this.router.navigate(['/login']);
      return;
    }
    this.getLocation();
    this.isLoading = false;
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = "28.6201416"
          this.longitude = "76.9879671"

          console.log("Latitude:", this.latitude);
          console.log("Longitude:", this.longitude);
        },
        (error) => {
          console.warn("GPS Permission Denied or Unavailable", error);
          this.latitude = "0.0";
          this.longitude = "0.0";
        }
      );
    } else {
      console.warn("Geolocation is not supported");
      this.latitude = "0.0";
      this.longitude = "0.0";
    }
  }

  onPanChange(value: string) {
    this.panNumber = value.toUpperCase();
    clearTimeout(this.timeout);
    this.nameOnpanNumber = '';
    this.errorMessage = '';
    if (this.panNumber.length === 10) {
      this.timeout = setTimeout(() => {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(this.panNumber)) {
          this.toastr.error('Invalid PAN format');
          this.errorMessage = 'Invalid PAN format';
          return;
        }

        this.panService.verifyPan(this.panNumber).subscribe({
          next: (res) => {
            if (res.success) {
              this.nameOnpanNumber = res.name;
            } else {
              this.toastr.error(res.message || 'Invalid PAN');
              this.errorMessage = res.message || 'Invalid PAN';
            }
          },
          error: () => {
            this.toastr.error('API Error');
            this.errorMessage = 'API Error';
          }
        });

      }, 500);
    }
  }


  get colClass(): string {
    return this.showRecentTxns ? 'col-12 mb-3' : 'col mb-3';
  }


  toggleRecentTxns() {
    this.showRecentTxns = !this.showRecentTxns;
  }

  mobileNumber = '';
  mobileAadhar = '';
  panNumber = '';
  nameOnpanNumber = '';
  txnPin = '';
  isLoading = false;
  paymentMethod: string = '';
  errors = {
    mobileNumber: '',
    mobileOperator: '',
    mobileAadhar: ''
  };


  generateCustomerRefNo(): string {
    const length = 12;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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
      filename: 'AEPS_Transaction_Invoice.pdf',
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

  private validateForm(): boolean {

    // Amount
    if (!this.amount || this.amount < 100 || this.amount > 100000) {
      this.toastr.error('Amount must be between ₹100 and ₹1,00,000');
      return false;
    }

    // Mobile
    if (!this.mobileNumber || this.mobileNumber.length !== 10) {
      this.toastr.error('Enter valid 10-digit mobile number');
      return false;
    }

    // Aadhaar
    if (!this.mobileAadhar || this.mobileAadhar.length !== 12) {
      this.toastr.error('Enter valid 12-digit Aadhaar number');
      return false;
    }

    // PAN
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!this.panNumber || !panRegex.test(this.panNumber)) {
      this.toastr.error('Enter valid PAN card number');
      return false;
    }

    // Name
    if (!this.nameOnpanNumber || this.nameOnpanNumber.trim().length < 3) {
      this.toastr.error('Invalid name on PAN');
      return false;
    }

    // Payment Method
    if (!this.paymentMethod) {
      this.toastr.error('Please select a payment method');
      return false;
    }

    return true;
  }

  createOrderAndPay() {

    if (!this.validateForm()) {
      return;
    }


    const payload = {
      amount: Number(this.amount),
      userId: this.authServiceobj.getUserId(),
      mobile: this.mobileNumber,
      pan: this.panNumber,
      aadhar: this.mobileAadhar,
      name: this.nameOnpanNumber,
      PaymentMethod: this.paymentMethod
    };

    this.isLoading = true;

    this.razorpayService.createOrder(payload).subscribe({
      next: (res) => {
        this.isLoading = false;

        if (!res.success) {
          this.toastr.error(res.key);
          return;
        }

        this.openRazorpay(res);
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Order creation failed');
      }
    });
  }

  async openRazorpay(order: any) {

    const loaded = await this.loadRazorpayScript();

    if (!loaded) {
      this.toastr.error('Razorpay SDK failed');
      return;
    }

    const options = {
      key: order.key,
      amount: order.amount * 100,
      currency: 'INR',
      name: 'Instant Payment',
      description: 'Wallet Topup',
      order_id: order.orderId,

      handler: (response: any) => {
        this.paymentMethod = response.method?.toLowerCase() === 'card' ? 'card' : response.method?.toLowerCase();
        this.verifyPayment(response);
      },

      modal: {
        ondismiss: () => {
          this.isLoading = false;
        }
      },

      prefill: {
        name: this.nameOnpanNumber,
        contact: this.mobileNumber
      },

      notes: {
        userId: this.authServiceobj.getUserId()
      },

      theme: {
        color: '#054a58'
      },

      method: {
        netbanking: this.paymentMethod === 'netbanking',
        card: this.paymentMethod === 'card',
        upi: this.paymentMethod === 'upi',
        wallet: this.paymentMethod === 'wallet',
        emi: false,
        paylater: false
      }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', (resp: any) => {
      this.toastr.error('Payment Failed');
      console.error(resp);
    });

    rzp.open();
  }

  verifyPayment(response: any) {

    const payload = {
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id,
      signature: response.razorpay_signature
    };

    this.isLoading = true;

    this.razorpayService.verifyPayment(payload).subscribe({
      next: (res) => {
        this.isLoading = false;

        if (res.success) {
          this.toastr.success('Payment Successful 🎉');
          setTimeout(() => {
            this.loadInvoiceData(response);
          }, 2000);
        } else {
          this.toastr.error('Verification failed');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Verification API failed');
      }
    });
  }

  loadInvoiceData(response: any) {

    this.invoiceData = {
      AdhaarNo: this.mobileAadhar,
      MobileNo: this.mobileNumber,
      BankName: "Razorpay",
      PanNo: this.panNumber,
      Name: this.nameOnpanNumber,
      RRN: response.razorpay_payment_id,
      Amount: this.amount,
      TxnDate: new Date().toLocaleString()
    };
    this.modalService.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }


}
