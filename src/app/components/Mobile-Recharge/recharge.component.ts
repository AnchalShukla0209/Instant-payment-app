import { Component, signal,ViewChild,inject,TemplateRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, debounceTime, distinctUntilChanged, map, switchMap  } from 'rxjs';
import { NgbModal, NgbTypeaheadModule, NgbToastModule,NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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




@Component({
  selector: 'app-recharge',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbTypeaheadModule, NgbToastModule,LoaderComponent],
  templateUrl: './recharge.component.html',
  styleUrls: ['./recharge.component.scss']
})
export class RechargeComponent {
  private rechargeService = inject(RechargeService);
  private authServiceobj = inject(AuthService);
  private router = inject(Router);
  selectedService: 'PREPAID' | 'DTH' = 'PREPAID';
  isMobilePlanVisible = false;
  showMobilePlans = false;
  showDthPlans = false ; showPinError = false;
  mobileNumber = '';
  mobileAmount = '';
  mobileTxnPin = '';
  txnPin = '';
  dthNumber = '';
  dthOperator = '';
  dthAmount = '';
  dthTxnPin = '';
  isLoading = false;
  toastMessages: string[] = [];

  showMobileError = false;
  showOperatorError = false;
  showAmountError = false;
  operatorList: any[] = [];
  rechargeStatus='';
  txnid='';
  brid='';
  transactiondatetime='';
  userName='';
  

  errors = {
    mobileNumber: '',
    mobileOperator: '',
    mobileAmount: ''
  };

  mobileOperator: { label: string; value: string } | null = null;

  mobilePlans: Record<string, { amount: number; desc: string }[]> = {
    AIRTEL: [
      { amount: 289, desc: '2GB/day for 28 days' },
      { amount: 199, desc: '1.5GB/day for 24 days' }
    ],
    JIO: [
      { amount: 239, desc: '1.5GB/day for 28 days' },
      { amount: 149, desc: '1GB/day for 20 days' }
    ],
    vi: [
      { amount: 299, desc: '2GB/day + weekend rollover' },
      { amount: 179, desc: '1GB/day + 100 SMS/day' }
    ]
  };

  dthPlans: Record<string, { amount: number; desc: string }[]> = {
    tata: [
      { amount: 300, desc: 'Base Pack + Sports (28 Days)' },
      { amount: 450, desc: 'Family HD + Regional (30 Days)' },
      { amount: 650, desc: 'Premium HD + Kids + Sports (30 Days)' }
    ],
    dish: [
      { amount: 250, desc: 'Family Pack' },
      { amount: 399, desc: 'Kids + Entertainment' }
    ],
    airtel: [
      { amount: 275, desc: 'Basic + Regional' },
      { amount: 499, desc: 'Premium + HD' }
    ]
  };



  @ViewChild('invoiceModal', { static: true }) invoiceModal!: TemplateRef<any>;

  constructor(private modalService: NgbModal, private toastr: ToastrService,private operatorService: OperatorService) {}

  openModal() {
    const modalRef: NgbModalRef = this.modalService.open(this.invoiceModal, {
      size: 'lg', backdrop: 'static', keyboard: false 
    });

     modalRef.closed.subscribe(() => window.location.reload());
    modalRef.dismissed.subscribe(() => window.location.reload());
  }

  onTabSelect(type: 'PREPAID' | 'DTH') {
  this.selectedService = type;
  this.mobileOperator = null;
  this.mobileNumber = '';
  this.mobileAmount = '';
  this.mobilePlans = {};
}

 selectedTab() {
  return this.selectedService;
}

  loadDTHPlans() {
    if (this.dthNumber.trim().length >= 6 && this.dthOperator) {
      this.showDthPlans = true;
    } else {
      this.showDthPlans = false;
    }
  }

  selectPlan(type: 'PREPAID' | 'dth', amount: number) {
    if (type === 'PREPAID') this.mobileAmount = String(amount);
    if (type === 'dth') this.dthAmount = String(amount);
  }

  loadMobilePlans() {
    if (this.mobileNumber.trim().length >= 10 && this.mobileOperator) {
      this.showMobilePlans = true;
      this.isMobilePlanVisible = true;
    } else {
      this.showMobilePlans = false;
      this.isMobilePlanVisible = false;
    }
  }

  getMobileFieldClass(): string {
    return this.showMobilePlans ? 'form-group' : 'col-md-4';
  }

  getRechargeFieldClass(): string {
    return this.showMobilePlans ? 'form-group col-md-6' : 'col-md-12';
  }

 search = (text$: Observable<string>) =>
  text$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(term => this.loadOperators(term))
  );

loadOperators(serviceName: string): Observable<any[]> {
  this.isLoading = true;
  return new Observable(observer => {
    this.operatorService.getOperators(this.selectedTab()).subscribe({
      next: (res) => {
        this.operatorList = res.map((op: any) => ({
          label: op.OperatorName,
          value: op.Spkey
        }));
        const filtered = this.operatorList.filter(v =>
          v.label.toLowerCase().includes(serviceName.toLowerCase())
        );
        observer.next(filtered);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load operators', err);
        observer.next([]);
        this.isLoading = false;
      }
    });
  });
}


  inputFormatter = (x: any) => x.label;
  resultFormatter = (x: any) => x.label;

  onSelect() {
    this.validateOperator();
  }

  validateMobileNumber() {
  const isDTH = this.selectedTab() === 'DTH';
  const trimmed = this.mobileNumber?.trim() || '';

  // For PREPAID: Exactly 10 digits; For DTH: Min 6
  if (isDTH) {
    this.showMobileError = trimmed.length < 6;
  } else {
    this.showMobileError = trimmed.length !== 10 || !/^\d+$/.test(trimmed);
  }
}


  validateOperator() {
    this.showOperatorError = !(this.mobileOperator && this.mobileOperator.value);
  }

  validateAmount() {
    this.showAmountError = !(this.mobileAmount && Number(this.mobileAmount) > 0);
  }

  showToastsFromErrors() {
    this.toastMessages = [];
   const isDTH = this.selectedTab() === 'DTH';

    if (!this.mobileNumber || this.mobileNumber.trim().length < (isDTH ? 6 : 10)) {
      this.toastr.error(isDTH ? 'Subscriber ID is required' : 'Mobile number is required', 'Error');
    }

    if (!this.mobileOperator) {
      this.toastr.error('Operator is required', 'Error');
      
    }
    if (!this.mobileAmount) {
      this.toastr.error('Amount is required', 'Error');
    }
  }

  removeToast(msg: string) {
    this.toastMessages = this.toastMessages.filter(m => m !== msg);
  }

  openPreviewModal(modalContent: any) {
    this.isLoading=true;
    this.validateMobileNumber();
    this.validateOperator();
    this.validateAmount();

    if (this.showMobileError || this.showOperatorError || this.showAmountError) {
      this.showToastsFromErrors();
       this.isLoading=false;
      return;
    }

     this.isLoading=false;
    this.modalService.open(modalContent, { centered: true, size: 'md', backdrop: 'static', keyboard: false  });
  }

  generateCustomerRefNo(): string {
  const length = 12;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


  submitRecharge() {
  this.isLoading = true;

  if (!this.txnPin || this.txnPin.trim().length === 0) {
    this.showPinError = true;
    this.isLoading = false;
    return;
  }

  this.showPinError = false;
  const userId = this.authServiceobj.getUserId();
  this.userName = this.authServiceobj.getUsername();

  if (!userId || !this.userName) {
    this.toastr.error('Session expired. Please login.');
    this.router.navigate(['/login']);
    return;
  }

  const payload: RechargeRequest = {
    UserId: Number(userId),
    userName: this.userName,
    MobileNumber: this.mobileNumber,
    Operator: this.mobileOperator?.label || '',
    operatorCode: this.mobileOperator?.value || '',
    Amount: Number(this.mobileAmount)!,
    TxnPin: this.txnPin,
    Type: this.selectedTab() === 'PREPAID' ? 'BLL2' : 'DTH2',
    CustomerRefNo: this.generateCustomerRefNo()
  };

  this.rechargeService.submitRecharge({ payload }).subscribe({
    next: (res) => {
      this.isLoading = false;
      this.rechargeStatus = res.message;
      this.txnid = res.txnid;
      this.brid = res.apitxnid;
      this.transactiondatetime = res.transactiondatetime;

      if (res.success) {
        this.toastr.success(`Recharge Submitted for ${this.mobileNumber} | ₹${this.mobileAmount}`);
      } 
      else if((res.success== false && res.message==='Invalid Transaction PIN')||(res.success== false && res.message==='Invalid User')||(res.success== false && res.message==='Invalid Operator')||(res.success== false && res.message==='Insufficient balance in wallet. Please add funds.')) {
        this.toastr.error(res.message);
        return;
      }
      else
      {
        this.toastr.error(res.message || 'Recharge failed');
        return;
      }

      // 🔁 Open modal and reload page when modal is closed or dismissed
      const modalRef = this.modalService.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false  });

      modalRef.closed.subscribe(() => window.location.reload());
      modalRef.dismissed.subscribe(() => window.location.reload());
    },
    error: () => {
      this.isLoading = false;
      this.toastr.error('API error. Try again later.');
    }
  });
}


  onPinChange() {
    if (this.txnPin && this.txnPin.trim().length > 0) {
      this.showPinError = false;
    }
  }

downloadInvoice() {
    this.isLoading=true;
  const original = document.getElementById('invoiceContent')!;
  const clone = original.cloneNode(true) as HTMLElement;

  // Remove animation for PDF
  const icon = clone.querySelector('.success-icon');
  if (icon) {
    icon.classList.add('no-animate');
  }

  html2pdf().set({
    margin: 0.2,
    filename: 'Recharge_Invoice.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).from(clone).save();
  this.isLoading=false;
}



}
