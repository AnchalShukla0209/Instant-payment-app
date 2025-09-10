import { Component, signal, ViewChild, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-Money-Transfer',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, NgbTypeaheadModule, NgbToastModule, LoaderComponent],
  templateUrl: './Money-Transfer.component.html',
  styleUrls: ['./Money-Transfer.component.scss']
})
export class MoneyTransferComponent {
  private rechargeService = inject(RechargeService);
  private authServiceobj = inject(AuthService);
  private router = inject(Router);
  selectedService: string = 'Money-Transfer-1';
  selectedicon: string = 'bi-cash-stack';
  showRecentTxns = false;
  amount: any = null;

  services = [
    { key: 'Money-Transfer-1', label: 'Money-Transfer-1', icon: 'bi-cash-stack' },
    { key: 'Money-Transfer-2', label: 'Money-Transfer-2', icon: 'bi-cash-stack' },
    { key: 'Money-Transfer-3', label: 'Money-Transfer-3', icon: 'bi-cash-stack' }
  ];

  banks = [
    { code: 'SBI', name: 'State Bank Of India' },
    { code: 'UB', name: 'UCO Bank' },
    { code: 'BOI', name: 'Bank Of India' },
    { code: 'PNB', name: 'Punjab National Bank' },
    { code: 'UBI', name: 'Union Bank Of India' },
    { code: 'AB', name: 'Axis Bank' },
    { code: 'HDB', name: 'HDFC Bank' }
  ];


  onTabSelect(service: string) {
    this.selectedService = service;
    this.selectedicon = this.selectedService === 'Money-Transfer-1' ? 'bi-cash-stack' : this.selectedService === 'Money-Transfer-2' ? 'bi-cash-stack'
      : this.selectedService === 'Money-Transfer-3' ? 'bi-cash-stack' : '';
    this.amount = null;
  }
  selectedTab() {
    return this.selectedService;
  }
  get colClass(): string {
    if (this.showRecentTxns) {
      return 'form-group';
    }
    const hasAmount = ['Cash Withdrawal', 'Cash Deposit', 'Aadhar Pay'].includes(this.selectedTab());
    return hasAmount ? 'col-md-3' : 'col-md-4';
  }
  toggleRecentTxns() {
    this.showRecentTxns = !this.showRecentTxns;
  }

  loadMobilePlans() { }

  onScanSuccess() {
    this.fingerprintSuccess = true;
  }

  mobileNumber = '';
  mobileAadhar = '';
  bankname = '';
  txnPin = '';
  otp = '';
  showPinError = false;
  fingerprintSuccess = false;
  fingerprintProcess = true;
  validateOTPforBenef = false;
  validateOTPforPayment = false
  isLoading = false;
  toastMessages: string[] = [];

  showMobileError = false;
  showOperatorError = false;
  showAmountError = false;
  operatorList: any[] = [];


  errors = {
    mobileNumber: '',
    mobileOperator: '',
    mobileAadhar: ''
  };

  selectedDevice = '';

  devices: { id: string; label: string; icon: string }[] = [
    { id: 'Mantra', label: 'Mantra L1', icon: 'myntra.png' },
    { id: 'Morpho', label: 'Morpho L1', icon: 'morpho.jpg' },
    { id: 'Startek', label: 'Startek L1', icon: 'Startek.jpg' }
  ];


  beneficiaryForm!: FormGroup;
  senderForm!: FormGroup;

  @ViewChild('invoiceModal') invoiceModal: any;
  @ViewChild('addNewBeneficary') addNewBeneficaryodal: any;
  @ViewChild('addNewsender') addNewsendermodel: any;
  @ViewChild('previewModal') previewModalobj: any;
  @ViewChild('previewModalforSender') previewModalforSenderobj: any;
  @ViewChild('previewModalforBeneficiary') previewModalforBeneficiaryobj: any;

  ngOnInit() {
    this.beneficiaryForm = this.fb.group({
      accountNumber: [
        '',
        [Validators.required, Validators.pattern('^[0-9]*$')]
      ],
      beneficiaryNumber: ['', Validators.required],
      ifscCode: ['', Validators.required],
      branchName: ['', Validators.required]
    });

    this.senderForm = this.fb.group({
      senderName: ['', Validators.required],
      mobileNumber: [
        '',
        [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]
      ],
      adharNumber: ['', [Validators.required, Validators.pattern('^[0-9]{12}$')]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      pinCode: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{6}$')]
      ]
    });
  }

  private showValidationMessages(group: FormGroup) {
    const messages: string[] = [];
    Object.keys(group.controls).forEach(key => {
      const control = group.get(key);
      if (control && control.invalid) {
        messages.push(`• ${this.getValidationMessage(key, control.errors)}`);
      }
    });

    if (messages.length) {
      this.toastr.error(messages.join('<br>'), 'Validation Message', { enableHtml: true });
    }

    // if (messages.length) {
    //   Swal.fire({
    //     icon: 'error',
    //     title: 'Validation Error',
    //     html: messages.join('<br>'),   // ✅ show messages as HTML
    //     confirmButtonText: 'OK'
    //   });
    // }
  }

  private getValidationMessage(field: string, errors: any): string {
    if (errors.required) {
      switch (field) {
        case 'senderName': return 'Sender Name is required.';
        case 'mobileNumber': return 'Mobile Number is required.';
        case 'adharNumber': return 'Aadhar Number is required.';
        case 'address': return 'Address is required.';
        case 'city': return 'City is required.';
        case 'pinCode': return 'Pin Code is required.';
      }
      return `${field} is required.`;
    }
    if (errors.email) return 'Email must be valid (e.g., test@example.com).';
    if (errors.pattern) {
      switch (field) {

        case 'accountNumber': return 'Account Number must be a valid and should be only numeric values';
        case 'mobileNumber': return 'Mobile Number must be a valid 10-digit number starting with 6-9.';
        case 'pinCode': return 'Pin Code must be a 6-digit number.';
        case 'adharNumber': return 'Aadhar Number must be a 12-digit number.';

        default: return `${field} format is invalid.`;
      }
    }
    return `${field} is invalid.`;
  }


  constructor(private fb: FormBuilder, private modalService: NgbModal, private toastr: ToastrService, private operatorService: OperatorService) { }

  captureDone = signal(false);
finalUrl: string = '';
MethodCapture: string = '';
MethodInfo: string = '';
rdServiceInfo: string = '';

private buildFullUrl(path: string, isHttps: boolean): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const ipPortPattern = /^\/(\d{1,3}\.){3}\d{1,3}:\d+/;
  if (ipPortPattern.test(path)) {
    const proto = isHttps ? 'https://' : 'http://';
    return proto + path.replace(/^\//, '');
  }
  return this.finalUrl + (path.startsWith('/') ? path : '/' + path);
}

async discoverRdService(deviceType: 'Mantra' | 'Morpho' | 'Startek'): Promise<boolean> {
  const isHttps = window.location.href.includes('https');
  const primaryUrl = isHttps ? 'https://127.0.0.1:' : 'http://127.0.0.1:';

  const handleSuccess = (data: string, port: number): boolean => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');
    const rdService = xmlDoc.querySelector('RDService');
    if (!rdService) return false;

    this.rdServiceInfo = rdService.getAttribute('info') || '';
    this.finalUrl = primaryUrl + port;

    const interfaces = xmlDoc.querySelectorAll('Interface');
    interfaces.forEach((node) => {
      const id = node.getAttribute('id');
      const path = node.getAttribute('path') || '';
      if (id === 'CAPTURE') this.MethodCapture = path;
      if (id === 'DEVICEINFO') this.MethodInfo = path;
    });

    console.log(`✅ RDService found (${this.rdServiceInfo}) at port ${port}`);
    return true;
  };

  return new Promise((resolve, reject) => {
    const ports = Array.from({ length: 21 }, (_, i) => 11100 + i);

    const tryNextPort = (index: number) => {
      if (index >= ports.length) {
        this.isLoading = false;
        this.toastr.error('Connection failed. Please try again.');
        return reject('Device not found');
      }
      const port = ports[index];
      fetch(primaryUrl + port, { method: 'RDSERVICE', mode: 'cors' })
        .then(res => res.text())
        .then(data => {
          if (handleSuccess(data, port)) resolve(true);
          else tryNextPort(index + 1);
        })
        .catch(() => tryNextPort(index + 1));
    };

    tryNextPort(0);
  });
}

async captureRdData(deviceType: 'Mantra' | 'Morpho' | 'Startek'): Promise<string> {
  this.isLoading = true;
  try {
    await this.discoverRdService(deviceType);
    const isHttps = window.location.href.includes('https');
    if (this.MethodInfo) {
      const deviceInfoUrl = this.buildFullUrl(this.MethodInfo, isHttps);
      console.log('📡 Calling DEVICEINFO →', deviceInfoUrl);

      const deviceInfoRes = await fetch(deviceInfoUrl, {
        method: 'DEVICEINFO',
        mode: 'cors'
      });
      const deviceInfoXml = await deviceInfoRes.text();
      console.log('ℹ️ DeviceInfo Response:', deviceInfoXml);
    }
    const pidXml = `<PidOptions ver="1.0"><Opts env="P" fCount="1" fType="0" iCount="" iType="" pCount="" pType="" format="0" pidVer="2.0" timeout="10000" otp="" wadh="" posh=""/></PidOptions>`;
    const captureUrl = this.buildFullUrl(this.MethodCapture, isHttps);
    console.log('📡 Calling CAPTURE →', captureUrl);
    const response = await fetch(captureUrl, {
      method: 'CAPTURE',
      mode: 'cors',
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      body: pidXml
    });

    const data = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, 'text/xml');
    const errCode = xmlDoc.querySelector('Resp')?.getAttribute('errCode') || '';
    const errInfo = xmlDoc.querySelector('Resp')?.getAttribute('errInfo') || '';

    const errorCodes = [
      '700','720','1001','2100','740','214','10','28','4001',
      '207','6','216','571','4003','215','52'
    ];

    this.isLoading = false;

    if (errorCodes.includes(errCode)) {
      this.toastr.error(`${errInfo} capture failed or RD not connected.`);
      throw new Error(`${errInfo} capture failed or RD not connected.`);
    }

    return data;
  } catch (err: any) {
    this.isLoading = false;
    throw err;
  }
}

selectDevice(deviceId: string) { this.selectedDevice = deviceId; }

startCapture(event?: Event): void {
  event?.preventDefault();
  event?.stopPropagation();
  this.isLoading = true;

  this.captureRdData(this.selectedDevice as 'Mantra' | 'Morpho' | 'Startek')
    .then(xml => {
      this.fingerprintSuccess = true;
      this.toastr.success('Capture Success\n\n' + xml);
    })
    .catch(err => {
      this.fingerprintSuccess = false;
      this.toastr.error(err.message || 'Capture failed');
    })
    .finally(() => { this.isLoading = false; });
}

  inputFormatter = (x: any) => x.label;
  resultFormatter = (x: any) => x.label;

  showToastsFromErrors() {
    this.toastMessages = [];
    if (this.mobileNumber.trim().length < 10) {
      this.toastr.error('Mobile number is required', 'Error');
    }


  }

  removeToast(msg: string) {
    this.toastMessages = this.toastMessages.filter(m => m !== msg);
  }

  openPreviewModal(modalContent: any) {

    if (this.mobileNumber == '6398028236') {
      //this.modalService.open(modalContent, { centered: true, size: 'md' });
      this.showRecentTxns = true;
    }
    else {
      this.toastr.error('Sender not Registered with this mobile number, Please Register')
      this.showRecentTxns = false;
      this.senderForm = this.fb.group({
        senderName: ['', Validators.required],
        mobileNumber: [
          this.mobileNumber,
          [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]
        ],
        adharNumber: ['', [Validators.required, Validators.pattern('^[0-9]{12}$')]],
        address: ['', Validators.required],
        city: ['', Validators.required],
        pinCode: [
          '',
          [Validators.required, Validators.pattern('^[0-9]{6}$')]
        ]
      });
      this.modalService.open(this.addNewsendermodel, { size: 'md', backdrop: 'static', keyboard: false });
    }
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
    //this.isLoading=true;
    // if (!this.txnPin || this.txnPin.trim().length === 0) {
    //   this.showPinError = true;
    //   this.isLoading=false;
    //   return;
    // }

    // this.showPinError = false;
    // debugger
    const userId = this.authServiceobj.getUserId();
    const userName = this.authServiceobj.getUsername();

    if (!userId || !userName) {
      this.toastr.error('Session expired. Please login.');
      this.router.navigate(['/login']);
      return;
    }
    // const payload: RechargeRequest = {
    //   UserId: Number(userId),
    //   userName,
    //   MobileNumber: this.mobileNumber,
    //   Operator:  '',
    //   operatorCode:  '',
    //   Amount: 12323,
    //   TxnPin: this.txnPin,
    //   Type: 'BLL2',
    //   CustomerRefNo: this.generateCustomerRefNo()
    // };

    // this.rechargeService.submitRecharge({payload }).subscribe({
    //   next: (res) => {
    //     if (res.success) {
    //       this.toastr.success(`Recharge Submitted for ${this.mobileNumber} ` || 'Recharge successful');
    //       this.modalService.open(this.invoiceModal, { size: 'lg' });
    //       this.isLoading=false;
    //       // Optionally show invoice popup here
    //     } else {
    //       this.toastr.error(res.message || 'Recharge failed');
    //       this.isLoading=false;
    //     }
    //   },
    //   error: () => this.toastr.error('API error. Try again later.'),
    // });

    this.modalService.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false });

  }

  onPinChange() {
    if (this.txnPin && this.txnPin.trim().length > 0) {
      this.showPinError = false;
    }
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
      filename: 'Recharge_Invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(clone).save();
    this.isLoading = false;
  }

  AddNewBeneficiary() {
    this.modalService.open(this.addNewBeneficaryodal, {
      size: 'md',
      backdrop: 'static',   // prevent closing on outside click
      keyboard: false       // prevent closing on ESC key
    });

  }

  Pay() {

    this.validateOTPforPayment = false;
    this.modalService.open(this.previewModalobj, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  AddBeneficiary() {
    if (this.beneficiaryForm.invalid) {
      this.beneficiaryForm.markAllAsTouched();
      this.showValidationMessages(this.beneficiaryForm);
      return;
    }
    this.validateOTPforBenef = false;
    this.modalService.open(this.previewModalforBeneficiaryobj, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  AddSenderPr() {
    if (this.senderForm.invalid) {
      this.senderForm.markAllAsTouched();
      this.showValidationMessages(this.senderForm);
      return;
    }
    this.fingerprintProcess = true;
    this.modalService.open(this.previewModalforSenderobj, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  FinalSenderCreation() {
    this.ResetSenderForm();
    this.selectedDevice = '';
    this.fingerprintProcess = true;
    this.fingerprintSuccess= false;
    Swal.fire({
      icon: 'success',
      title: 'Sender Created',
      html: 'Sender Record Created Successfully',
      confirmButtonText: 'OK'
    });
    this.modalService.dismissAll();
  }

  FinalBeneForCreation() {

    this.modalService.dismissAll();
    this.validateOTPforBenef = false;
    this.ResetBenefForm();
    Swal.fire({
      icon: 'success',
      title: 'Beneficieary Created',
      html: 'Beneficieary Record Created Successfully',
      confirmButtonText: 'OK'
    });
  }

  ValidateOTP() {
    this.fingerprintProcess = false;
    this.toastr.success('OTP Validated Successfully')
  }

  getBankName(code: string): string {
    const bank = this.banks.find(b => b.code === code);
    return bank ? bank.name : '';
  }

  ValidateOTPForBenef() {
    this.validateOTPforBenef = true;
    this.toastr.success('OTP Validated Successfully')
  }

  ValidateOTPForPayment() {
    this.validateOTPforPayment = true;
    this.toastr.success('OTP Validated Successfully')
  }

  ResetBenefForm() {
    this.beneficiaryForm = this.fb.group({
      accountNumber: [
        '',
        [Validators.required, Validators.pattern('^[0-9]*$')]
      ],
      beneficiaryNumber: ['', Validators.required],
      ifscCode: ['', Validators.required],
      branchName: ['', Validators.required]
    });
  }

  ResetSenderForm() {
    this.senderForm = this.fb.group({
      senderName: ['', Validators.required],
      mobileNumber: [
        '',
        [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]
      ],
      adharNumber: ['', [Validators.required, Validators.pattern('^[0-9]{12}$')]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      pinCode: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{6}$')]
      ]
    });
  }

  ResendOTPForPayment() {
    this.toastr.success('OTP has been sent Successfully');
  }

  ResendOTPForSender() {
    this.toastr.success('OTP has been sent Successfully');
  }

  ResendOTPForBenf() {
    this.toastr.success('OTP has been sent Successfully');
  }

  ValidateBankDetails(){
     this.toastr.success('Bank Details has been verified Successfully');
  }


}
