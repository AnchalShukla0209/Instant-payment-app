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
import { MoneyTransferService } from '../../services/money-transfer.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MasterService, ServiceStatusResponse } from '../../services/master.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { PidConfig, PID_OPTIONS_CONFIG } from '../../services/pid-options.config';

@Component({
  selector: 'app-Money-Transfer',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, NgbTypeaheadModule, NgbToastModule, LoaderComponent, NgSelectModule],
  templateUrl: './Money-Transfer.component.html',
  styleUrls: ['./Money-Transfer.component.scss']
})
export class MoneyTransferComponent {
  private rechargeService = inject(RechargeService);
  private authServiceobj = inject(AuthService);
  private router = inject(Router);
  selectedService: string = 'FINO';
  fingurdataKYCforJPB = true;
  selectedicon: string = 'bi-cash-stack';
  showRecentTxns = false;
  amount: any = null;
  benedet: any = {};
  validatebankdetails: boolean = false;
  currentBankName: string = '';
  currentBankId: string = '';
  currentBankIfscCode: string = '';
  currentBeneId: string = '';
  currentBeneName: string = '';
  enteredPaymentOTP: string = '';
  invoiceData: any = null;
  availableLimit: string = '';
  tramoState: string = '';
  otpverification: boolean = false;
  tramoOTP: string = '';
  enteredMPIN: string = '';
  selectedServiceIcon: string = 'FINO - Money Transfer';
  consentContent: string = '';
  PPI_OTP_TOKEN: string = '';
  PPI_TOKEYKEY: string = '';
  PPI_EnteredOTP: string = '';
  PPI_EnteredOTPFlag: boolean = false;
  panCardNo: string = '';
  showPPIOtpBlock: boolean = false;
  showPPIBiometricBlock: boolean = false;
  originalFingerXml: string = '';
  enteredPaymentOTPForPPI: string = '';
  ppiPaymentOtpToken: string = '';
  showPPIPaymentOtpBlock: boolean = false;
  selectedKycType: 'OTP' | 'BIOMETRIC' | '' = '';
  otpToken: string = '';
  aadharOtpInput: string = '';
  applicationNo: string = '';
  xmlBase64: string = '';
  invoicemobno : string ='';

  services = [
    { key: 'FINO', label: 'FINO - Money Transfer', icon: 'bi-cash-stack' },
    { key: 'TRAMO', label: 'Money Transfer - 2', icon: 'bi-cash-stack' },
    { key: 'PPI', label: 'Money Transfer - 3', icon: 'bi-cash-stack' },
  ];

  banks: any[] = [];


  onTabSelect(service: string) {
    this.selectedService = service;
    this.selectedServiceIcon = this.selectedService === 'FINO' ? 'FINO - Money Transfer' : this.selectedService === 'TRAMO' ? 'Money Transfer - 2' : this.selectedService === 'PPI' ? 'Money-Transfer-3' :
      this.selectedService === 'Money-Transfer-3' ? 'bi-cash-stack' : '';
    this.selectedicon = this.selectedService === 'FINO' ? 'bi-cash-stack' : this.selectedService === 'TRAMO' ? 'bi-cash-stack'
      : this.selectedService === 'Money-Transfer-3' ? 'bi-cash-stack' : '';
    this.amount = null;
    this.mobileNumber = "";
    this.showVerifyButton = true;
    this.senderName = "";
    this.showRecentTxns = false;
    this.isSenderRegistered = false;

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

  buildPidXml(config: PidConfig): string {
    const attrs = Object.entries(config)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");

    return `<PidOptions ver="1.0"> <Opts ${attrs}/> </PidOptions>`;
  }

  //Api Keys
  otpRequestId: string = '';
  kycReqId: string = '';

  beneficiaries: any[] = [];
  senderId: string = '';
  bankLogos: { [key: string]: string } = {
    'HDFC BANK': 'https://1.bp.blogspot.com/-si2dzXq5_7o/YCqD6NmLHUI/AAAAAAAAB50/dli_4hqMX1sIKaadhLRHfklKcD_H-QO2gCLcBGAsYHQ/s320/HDFC%2BBANK%2BPNG.png',
    'ICICI BANK': 'https://logodix.com/logo/2206403.jpg',
    'STATE BANK OF INDIA': 'https://cdn.brandfetch.io/sbi.co.in/fallback/lettermark/theme/dark/h/256/w/256/icon?c=1bfwsmEH20zzEfSNTed',
    'AXIS BANK': 'https://tse1.explicit.bing.net/th/id/OIP.EuAvRsIGfve4QSmYPlImcQAAAA?rs=1&pid=ImgDetMain&o=7&rm=3',
    'KOTAK MAHINDRA BANK': 'https://seekvectors.com/files/download/kotak-mahindra-bank-logo-04.png',

    // 👉 Add more banks here
  };

  senderName: string = '';
  isSenderRegistered: boolean = false; // true if ResponseCode === 0
  showVerifyButton: boolean = true;

  //END
  mobileNumber = '';
  mobileAadhar = '';
  bankname = '';
  txnPin = '';
  otp = '';
  userid = '';
  showPinError = false;
  fingerprintSuccess = false;
  fingerprintProcess = false;
  validateOTPforBenef = true;//false to true
  validateOTPforPayment = false
  isLoading = false;
  toastMessages: string[] = [];

  showMobileError = false;
  showOperatorError = false;
  showAmountError = false;
  operatorList: any[] = [];
  searchText: string = '';


  errors = {
    mobileNumber: '',
    mobileOperator: '',
    mobileAadhar: ''
  };

  selectedDevice = '';
  merchantMobile = '';

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

    const userId = this.authServiceobj.getUserId();
    const userName = this.authServiceobj.getUsername();

    if (!userId || !userName) {
      Swal.fire('Validation', 'Session expired. Please login.', 'warning');
      this.router.navigate(['/login']);
      return;
    }

    this.CheckServiceStatus(Number(userId), userName)

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

    this.loadBanks();
  }

  CheckServiceStatus(userId: number, serviceName: string): void {
    this.isLoading = false;
    this.masterService.checkServiceStatus("Money Transfer", userId).subscribe({
      next: (res: ServiceStatusResponse) => {
        console.log('Service Status Response:', res);
        const userType = this.authServiceobj.getUsertype();

        if (!res.userServiceActive || userType != 'Retailer') {
          this.isLoading = true;
          Swal.fire({
            title: 'Attention!',
            text: "This is not valid page or You have not rights to access this page. Please contact to admin",
            icon: 'warning',
            confirmButtonColor: '#5e2f82'
          }).then(() => {
            this.router.navigate(['/dashboard']);
            return;
          });
        }

        if (!res.serviceActive) {
          this.isLoading = true;
          Swal.fire({
            title: 'Attention!',
            text: "Money Transfer is down or not active. Please contact to admin",
            icon: 'warning',
            confirmButtonColor: '#5e2f82'
          }).then(() => {
            this.router.navigate(['/dashboard']);
            return;
          });
        }
      },
      error: (err) => {
        console.error('Error checking service status', err);
        this.isLoading = true;
      }
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


  constructor(private fb: FormBuilder, private modalService: NgbModal, private toastr: ToastrService, private operatorService: OperatorService, private _MoneyTransferService: MoneyTransferService, private masterService: MasterService) { }

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

      // ✅ Device-specific interface parsing
      if (deviceType === 'Mantra') {
        xmlDoc.querySelectorAll('Interface').forEach((node) => {
          const path = node.getAttribute('path') || '';
          if (path === '/rd/capture') this.MethodCapture = path;
          if (path === '/rd/info') this.MethodInfo = path;
        });
      } else {
        xmlDoc.querySelectorAll('Interface').forEach((node) => {
          const id = node.getAttribute('id');
          const path = node.getAttribute('path') || '';
          if (id === 'CAPTURE') this.MethodCapture = path;
          if (id === 'DEVICEINFO') this.MethodInfo = path;
        });
      }

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
        const deviceInfoRes = await fetch(deviceInfoUrl, { method: 'DEVICEINFO', mode: 'cors' });
        const deviceInfoXml = await deviceInfoRes.text();
        console.log('ℹ️ DeviceInfo Response:', deviceInfoXml);
      }

      // ✅ Different PidOptions depending on device

      const config = PID_OPTIONS_CONFIG[this.selectedService][this.fingurdataKYCforJPB ? "EKYC" : "BALANCE"];
      const pidXml = this.buildPidXml(config);

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
        '700', '720', '1001', '2100', '740', '214', '10', '28', '4001',
        '207', '6', '216', '571', '4003', '215', '52'
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
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');
        const resp = xmlDoc.querySelector('Resp');
        const errCode = resp?.getAttribute('errCode') || '0';
        const qScore = parseInt(resp?.getAttribute('qScore') || '0', 10);
        if (errCode !== '0') {
          this.fingerprintSuccess = false;
          this.toastr.error('Device not ready / Finger Capture Failed');
          return;
        }
        if (qScore < 60) {
          this.fingerprintSuccess = false;
          this.toastr.error('Finger Mismatch');
          return;
        }
        this.toastr.success('Fingurprint Captured');
        const senderMobile = this.senderForm.value.mobileNumber;
        const merchantMobile = this.merchantMobile;
        const aadharNo = this.senderForm.value.adharNumber;
        this.xmlBase64 = btoa(unescape(encodeURIComponent(xml)));
        if (this.selectedService === 'PPI') {
          this.originalFingerXml = xml;
          this.fingerprintSuccess = true;
          this.selectedDevice = '';
        }
        if (this.selectedService === 'FINO') {
          this.isLoading = true;
          this._MoneyTransferService.getLocation().then(({ latitude, longitude }) => {
            this._MoneyTransferService.doKyc(senderMobile, merchantMobile, aadharNo, this.xmlBase64, latitude, longitude)
              .subscribe({
                next: (res: any) => {
                  debugger
                  if (res.ResponseCode === 0) {
                    this.fingerprintSuccess = true;
                    this.kycReqId = res.ResponseData;
                    this.fingerprintProcess = true;
                    this.toastr.success('EKYC Done');
                    this.isLoading = false;

                  } else {
                    this.toastr.error(res.DisplayMessage || 'EKYC Failed');
                    this.fingerprintSuccess = false;
                    this.fingerprintProcess = false;
                    this.isLoading = false;
                  }
                },
                error: (err) => {
                  this.toastr.error(err.message || 'EKYC Failed');
                  this.fingerprintSuccess = false;
                  this.fingerprintProcess = false;
                  this.isLoading = false;
                }
              });
          });
        }
      })
      .catch(err => {
        this.fingerprintSuccess = false;
        this.toastr.error(err.message || 'Capture failed');
        this.isLoading = false;
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

  async openPreviewModal(modalContent: any) {
    this.isLoading = true;

    if (!this.isUserLoggedIn()) {
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    try {
      const { latitude, longitude } = await this._MoneyTransferService.getLocation();
      if (this.selectedService === 'FINO') {
        await this.loadSenderInfo(latitude, longitude);
      }
      if (this.selectedService === 'TRAMO') {
        await this.loadTramoSenderInfo();
      }
      if (this.selectedService === 'PPI') {
        await this.loadPPISender();
      }
    } catch (error) {
      this.toastr.error('Unexpected error occurred');
      this.isLoading = false;
    }
  }

  private loadPPISender(): Promise<void> {
    return new Promise((resolve) => {
      this._MoneyTransferService
        .checkPPISender(this.authServiceobj.getSessionKey(), this.mobileNumber, "110041", "Chandan")
        .subscribe({
          next: (res) => {
            if (res.Status_Code === "1") {
              this.PPI_OTP_TOKEN = res.Data;
              this.PPI_EnteredOTPFlag = true;
              this.toastr.success("OTP sent to registered mobile");
              this.isLoading = false;
            }
            resolve();
          },

          error: () => {
            this.toastr.error("Server error while checking PPI sender");
            this.isLoading = false;
            this.PPI_EnteredOTPFlag = false;
            resolve();
          }
        });
    });
  }

  validatePPIOtp() {
    if (this.PPI_EnteredOTP == "") {
      this.toastr.error('Please Enter Otp');
      return;
    }
    this.isLoading = true;
    this._MoneyTransferService
      .validatePPIOtp(this.authServiceobj.getSessionKey(), this.PPI_OTP_TOKEN, this.PPI_EnteredOTP)
      .subscribe({

        next: (res) => {
          if (res.Status_Code === "1") {
            this.toastr.success("Sender Verified Successfully");
            this.PPI_TOKEYKEY = res.Data[0].TokeyKey;
            this.senderName = res.Data[0].SenderName;
            this.applicationNo = res.Data[0].ApplicationNumber;
            this.consentContent = res.Data[0].consentContent;
            this.availableLimit = res.Data[0].WalletLimit;
            this.isSenderRegistered = true;
            this.PPI_EnteredOTPFlag = false;
            this.loadPPIBeneficiaries();
            this.isLoading = false;
            this.PPI_EnteredOTP = "";
            this.showVerifyButton = false;
          }
          else if (res.Status_Code === "5") {

            this.PPI_TOKEYKEY = res.Data[0].TokeyKey;
            this.applicationNo = res.Data[0].ApplicationNumber;
            this.consentContent = res.Data[0].consentContent;
            this.handleSenderNotRegistered();
            this.isLoading = false;
          }
          else if (res.Status_Code === "0") {
            this.toastr.error(res.Message);
            this.isLoading = false;
            return;
          }
        },

        error: () => { this.toastr.error("OTP validation failed"); this.isLoading = false; }
      });
  }

  private loadPPIBeneficiaries() {
    this.isLoading = true;
    this._MoneyTransferService
      .getPPIBeneficiaries(this.authServiceobj.getSessionKey(), this.mobileNumber, this.PPI_TOKEYKEY)
      .subscribe({
        next: (res) => {
          if (res.Status_Code === "1") {
            this.beneficiaries = res.Data.map((b: any) => ({
              AccountNo: b.accountNo,
              BeneName: b.beneficiaryName,
              BankName: b.bank,
              IFSCCode: b.ifsCcode,
              beneId: b.beneId,
              isBankVerified: b.isAcValidate
            }));
            this.PPI_EnteredOTP = "";
            this.PPI_EnteredOTPFlag = false;
            this.showRecentTxns = true;
          } else {
            this.beneficiaries = [];
            this.toastr.info("No beneficiaries found");
            this.showRecentTxns = true;
          }
          this.isLoading = false;
        },

        error: () => {
          this.toastr.error("Error fetching PPI beneficiaries");
          this.isLoading = false;
        }
      });
  }

  filteredBeneficiaries() {
    if (!this.searchText) return this.beneficiaries;

    const text = this.searchText.toLowerCase();

    return this.beneficiaries.filter(b =>
      b.BeneName?.toLowerCase().includes(text) ||
      b.AccountNo?.toLowerCase().includes(text) ||
      b.BankName?.toLowerCase().includes(text)
    );
  }

  private loadTramoSenderInfo(): Promise<void> {
    return new Promise((resolve) => {
      const sessionKey = this.authServiceobj.getSessionKey();
      this._MoneyTransferService.getTRAMOSenderInfo(
        this.mobileNumber,
        sessionKey
      ).subscribe({
        next: (res) => {
          if (res.Status_Code === "1") {
            this.handleTramoSenderRegistered(res.Data[0]);
          } else {
            this.handleTramoSenderNotRegistered();
          }
          resolve();
        },
        error: () => {
          this.toastr.error('Server error while verifying TRAMO sender');
          this.isLoading = false;
          resolve();
        }
      });
    });
  }

  private handleTramoSenderNotRegistered(): void {
    this.toastr.error('Sender not Registered with TRAMO, Please Register');
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
      pinCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    this.modalService.open(this.addNewsendermodel, {
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });

    this.isLoading = false;
  }



  private handleTramoSenderRegistered(data: any): void {
    this.isSenderRegistered = true;
    this.showVerifyButton = false;

    this.senderName = data.first_name;
    this.availableLimit = data.available_limit;

    this.toastr.success('Sender Verified Successfully');
    this.loadTramoBeneficiaries();
    this.isLoading = false;
  }

  private loadTramoBeneficiaries(): void {
    const sessionKey = this.authServiceobj.getSessionKey();
    this._MoneyTransferService.getTRAMOBeneficiaryInfo(this.mobileNumber, sessionKey)
      .subscribe({
        next: (res) => {
          if (res.Status_Code === "1") {
            try {
              const rawList = JSON.parse(res.Data);
              this.beneficiaries = rawList.map((b: any) => ({
                AccountNo: b.account_number,
                BeneName: b.name,
                BankName: b.bank_name,
                IFSCCode: b.ifsc,
                beneId: b.beneId,
                isBankVerified: b.is_bank_verified
              }));
            } catch (err) {
              this.toastr.error("Beneficiary parsing error");
              this.beneficiaries = [];
            }

          } else {
            this.toastr.info('No TRAMO beneficiaries found');
            this.beneficiaries = [];
          }

          this.showRecentTxns = true;
          this.isLoading = false;
        },

        error: () => {
          this.toastr.error('Error fetching TRAMO beneficiaries');
          this.isLoading = false;
        }
      });
  }


  private loadSenderInfo(latitude: string, longitude: string): Promise<void> {
    return new Promise((resolve) => {
      this._MoneyTransferService.getSenderInfo(
        this.mobileNumber,
        this.merchantMobile,
        latitude,
        longitude
      ).subscribe({
        next: (res) => {
          if (res.ResponseCode === 0) {
            this.handleSenderRegistered(res);
          } else {
            this.handleSenderNotRegistered();
          }
          resolve();
        },
        error: () => {
          this.toastr.error('Server error while verifying sender');
          this.isLoading = false;
          resolve();
        }
      });
    });
  }

  /** ✅ Handles sender registered case */
  private handleSenderRegistered(res: any): void {
    this.isSenderRegistered = true;
    this.showVerifyButton = false;

    const responseData = JSON.parse(res.ResponseData);
    this.senderName = responseData.CustomerName;
    this.toastr.success(res.DisplayMessage);

    this.loadBeneficiaries();
  }

  /** ✅ Loads beneficiaries */
  private loadBeneficiaries(): void {
    this._MoneyTransferService.getBeneficiaryInfo(this.mobileNumber).subscribe({
      next: (beneRes) => {
        if (beneRes.Status_Code === '1') {
          this.beneficiaries = beneRes.Data;
          this.senderId = beneRes.Data[0]?.SenderId || '';
        } else {
          this.toastr.info('No beneficiaries found');
          this.beneficiaries = [];
        }
        this.showRecentTxns = true;
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Error fetching beneficiaries');
        this.isLoading = false;
      }
    });
  }

  /** ✅ Handles sender not registered case */
  private handleSenderNotRegistered(): void {
    this.toastr.warning("Sender Not Registered — Please Add Sender");
    //this.toastr.error('Sender not Registered with this mobile number, Please Register');
    this.showRecentTxns = false;

    this.senderForm = this.fb.group({
      senderName: [this.authServiceobj.getUsername(), Validators.required],
      mobileNumber: [
        this.mobileNumber,
        [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]
      ],
      adharNumber: [this.authServiceobj.getUserAadharNumber(), [Validators.required, Validators.pattern('^[0-9]{12}$')]],
      address: [this.authServiceobj.getUserAddressLine1(), Validators.required],
      city: [this.authServiceobj.getUserCity(), Validators.required],
      pinCode: [this.authServiceobj.getUserPincode(), [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    this.modalService.open(this.addNewsendermodel, {
      size: 'md',
      backdrop: 'static',
      keyboard: false
    });

    this.isLoading = false;
  }

  private isUserLoggedIn(): boolean {
    this.userid = this.authServiceobj.getUserId();
    this.merchantMobile = this.authServiceobj.getUserPhoneNo();
    return !!this.userid;
  }


  onCancel() {
    this.isSenderRegistered = false;
    this.showVerifyButton = true;
    this.senderName = '';
    this.mobileNumber = ''; // optional: clear or keep value
    this.ResetSenderForm();
    this.ResetBenefForm();
    this.beneficiaries = [];
    this.showRecentTxns = false;
    this.PPI_EnteredOTP = "";
    this.PPI_EnteredOTPFlag = false;
    this.PPI_OTP_TOKEN = "";
    this.PPI_TOKEYKEY = "";
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

    const userId = this.authServiceobj.getUserId();
    const userName = this.authServiceobj.getUsername();

    if (!userId || !userName) {
      this.toastr.error('Session expired. Please login.');
      this.router.navigate(['/login']);
      return;
    }

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
      filename: 'DMT_Invoice.pdf',
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

  AddBeneficiary() {
    if (this.beneficiaryForm.invalid) {
      this.beneficiaryForm.markAllAsTouched();
      this.showValidationMessages(this.beneficiaryForm);
      return;
    }

    //this.validateOTPforBenef = true;
    this.validateOTPforBenef = this.selectedService === "TRAMO";
    this.modalService.open(this.previewModalforBeneficiaryobj, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
    });
    this.isLoading = false;
  }

  AddSenderPr() {
    this.isLoading = true;
    if (this.senderForm.invalid) {
      this.senderForm.markAllAsTouched();
      this.showValidationMessages(this.senderForm);
      this.isLoading = false;
      return;
    }

    if (this.selectedService === 'FINO') {
      const senderMobile = this.senderForm.value.mobileNumber.trim();
      const customerName = this.senderForm.value.senderName.trim();
      this.requestSenderOtp(senderMobile, customerName, '1', null, null, null, true);
      return;
    }

    if (this.selectedService === 'TRAMO') {
      this.addTramoSender();
      return;
    }

    if (this.selectedService === 'PPI') {
      if (this.selectedKycType == "") {
        this.toastr.error('Please Select KYC Type');
        this.isLoading = false;
        return;
      }
      if (this.selectedKycType === "OTP") {
        this.sendPpiAadharOtp();
      }
      this.modalService.open(this.previewModalforSenderobj, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false
      });
      this.isLoading = false;
      return;
    }

  }

  sendPpiAadharOtp() {
    this.isLoading = true;
    const payload = {
      SessionKey: this.authServiceobj.getSessionKey(),
      APIKey: "PPI01",
      TokeyKey: this.PPI_TOKEYKEY,
      AadharNo: this.senderForm.value.adharNumber,
      ConsentId: "c3",
      ApplicationNumber: this.applicationNo,
      pincode: this.senderForm.value.pinCode,
      RTName: this.senderForm.value.senderName
    };

    this._MoneyTransferService.PPISendAadharOTP(payload).subscribe(res => {
      if (res.Status_Code == "1") {
        this.otpToken = res.Data;
        this.otpverification = true;
        this.toastr.success("OTP sent successfully");
        this.isLoading = false;
      } else {
        this.toastr.error(res.Message);
        this.isLoading = false;
      }
    });

  }

  validatePpiAadharOtp() {
    this.isLoading = true;
    const payload = {
      SessionKey: this.authServiceobj.getSessionKey(),
      SenderMobile: this.senderForm.value.mobileNumber,
      APIKey: "PPI01",
      TokeyKey: this.PPI_TOKEYKEY,
      ApplicationNumber: this.applicationNo,
      AadharToken: this.otpToken,
      OTP: this.aadharOtpInput
    };

    this._MoneyTransferService.PPIValidateAadharOTP(payload).subscribe(res => {
      if (res.Status_Code == "1") {
        this.toastr.success("Aadhar Verified");
        this.isLoading = false;
        this.validatePpiPan();
      } else {
        this.toastr.error(res.Message);
        this.isLoading = false;
      }
    });

  }

  validatePpiPan() {
    this.isLoading = true;
    const payload = {
      SessionKey: this.authServiceobj.getSessionKey(),
      SenderMobile: this.senderForm.value.mobileNumber,
      APIKey: "PPI01",
      TokeyKey: this.PPI_TOKEYKEY,
      PancardNo: this.panCardNo,
      ApplicationNumber: this.applicationNo,
      pincode: this.senderForm.value.pinCode,
      RTName: this.senderForm.value.senderName
    };

    this._MoneyTransferService.PPIValidatePan(payload).subscribe(res => {
      if (res.Status_Code == "1") {
        this.toastr.success(res.Message);
        this.modalService.dismissAll();
        this.isLoading = false;
        this.panCardNo = "";
        this.aadharOtpInput = "";
        this.selectedKycType = "";
        this.PPI_EnteredOTPFlag = false;
        this.mobileNumber = "";
        this.PPI_EnteredOTP = "";
      } else {
        this.toastr.error(res.Message);
        this.isLoading = false;
      }
    });

  }

  private addTramoSender() {
    this.isLoading = true;
    const mobile = this.senderForm.value.mobileNumber;
    const fullName = this.senderForm.value.senderName.trim();
    const address = this.senderForm.value.address;
    const pincode = this.senderForm.value.pinCode;
    const sessionKey = this.authServiceobj.getSessionKey();
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ") || "";
    this._MoneyTransferService.registerTramoSender(
      mobile,
      firstName,
      lastName,
      address,
      pincode,
      sessionKey
    ).subscribe({
      next: (res) => {
        if (res.Status_Code === "1") {
          this.tramoState = res.Data[0].state;
          this.toastr.success(res.Message);

          this.isLoading = false;
        } else {
          this.toastr.error(res.Message || 'Sender registration failed');
          this.isLoading = false;
        }
        this.fingerprintProcess = true;
        this.otpverification = true;

        this.modalService.open(this.previewModalforSenderobj, {
          size: 'lg',
          backdrop: 'static',
          keyboard: false
        });
      },
      error: () => {
        this.toastr.error('Server Error');
        this.isLoading = false;
      }
    });
  }

  private requestSenderOtp(
    senderMobile: string,
    customerName: string,
    otptype: string,
    benename?: string | null,
    accountno?: string | null,
    ifsccode?: string | null,
    openPreview: boolean = false, openPreviewforBen: boolean = false
  ): void {
    this.isLoading = true;
    const merchantMobile = this.merchantMobile;

    this._MoneyTransferService.getLocation().then(({ latitude, longitude }) => {
      this._MoneyTransferService
        .sendOtp(senderMobile, merchantMobile, customerName, latitude, longitude, otptype, benename, accountno, ifsccode)
        .subscribe({
          next: (res: any) => {
            debugger
            if (res.ResponseCode === 0) {
              this.otpRequestId = res.ResponseData;
              this.toastr.success(res.DisplayMessage || 'OTP Generated Successfully');
              this.isLoading = false;
              if (openPreview) {
                this.fingerprintProcess = false;
                this.modalService.open(this.previewModalforSenderobj, {
                  size: 'lg',
                  backdrop: 'static',
                  keyboard: false,
                });
                this.isLoading = false;
              }

              if (openPreviewforBen) {
                this.validateOTPforBenef = true;
                this.modalService.open(this.previewModalforBeneficiaryobj, {
                  size: 'lg',
                  backdrop: 'static',
                  keyboard: false,
                });
                this.isLoading = false;
              }


            } else {
              this.toastr.error(res.DisplayMessage || 'Failed to generate OTP');
              this.isLoading = false;
            }
          },
          error: (err) => {
            this.toastr.error(err.message || 'Server Error')
            this.isLoading = false;
          },
        });
    });
  }

  ResendOTPForSender() {

    if (this.selectedService === 'FINO') {
      // existing
      const senderMobile = this.senderForm.value.mobileNumber;
      const customerName = this.senderForm.value.senderName;
      this.requestSenderOtp(senderMobile, customerName, '1');
      return;
    }
    if (this.selectedService === 'TRAMO') {
      this.addTramoSender();
    }
  }

  FinalSenderCreation() {
    if (this.selectedService === 'FINO') {

      this.isLoading = true;
      const senderMobile = this.senderForm.value.mobileNumber.toString();
      const merchantMobile = this.merchantMobile.toString();
      const otp = (document.querySelector<HTMLInputElement>('input[placeholder="Enter OTP"]')?.value || '').trim();

      if (!otp) {
        this.toastr.error('Please enter OTP');
        this.isLoading = false;
        return;
      }

      if (!this.otpRequestId || !this.kycReqId) {
        this.toastr.error('Please complete OTP and KYC first');
        this.isLoading = false;
        return;
      }
      debugger
      this._MoneyTransferService.getLocation().then(({ latitude, longitude }) => {
        this._MoneyTransferService.addSender(
          senderMobile,
          merchantMobile,
          otp,
          this.otpRequestId,
          this.kycReqId,
          latitude,
          longitude
        )
          .subscribe({
            next: (res: any) => {
              if (res.ResponseCode === 0) {
                this.ResetSenderForm();
                this.selectedDevice = '';
                this.fingerprintProcess = false;
                this.fingerprintSuccess = false;
                Swal.fire({
                  icon: 'success',
                  title: 'Sender Created',
                  html: res.DisplayMessage || 'Customer Registration Successful',
                  confirmButtonText: 'OK'
                });
                this.isLoading = false;
                this.modalService.dismissAll();

              } else {
                this.toastr.error(res.DisplayMessage || 'Sender registration failed');
                this.isLoading = false;
              }
            },
            error: (err) => {
              this.toastr.error(err.message || 'Server Error')
              this.isLoading = false;
            }
          });
      });

    }

    if (this.selectedService === 'TRAMO') {
      this.finalizeTramoSender();
      return;
    }

    if (this.selectedService === 'PPI') {
      if (this.panCardNo == "") {
        this.toastr.error('Please Enter valid PAN Number');
        this.isLoading = false;
        return;
      }
      if (this.selectedKycType === 'OTP') {
        if (this.aadharOtpInput == "") {
          this.toastr.error('Please Enter valid OTP');
          this.isLoading = false;
          return;
        }
        this.validatePpiAadharOtp();
      }

      if (this.selectedKycType === 'BIOMETRIC') {
        this.validatePpiBiometric(this.xmlBase64);
      }
    }
  }

  validatePpiBiometric(bioData: string) {

    if (this.authServiceobj.getUserLat() == "" || this.authServiceobj.getUserLongtitude() == "") {
      this.toastr.error('Please ask to admin update Latitude and Longtitude');
      return;
    }
    this.isLoading = true;

    const payload = {
      SessionKey: this.authServiceobj.getSessionKey(),
      APIKey: "PPI01",
      TokeyKey: this.PPI_TOKEYKEY,
      ApplicationNumber: this.applicationNo,
      pincode: this.senderForm.value.pinCode,
      RTName: this.senderForm.value.senderName,
      AadharNo: this.senderForm.value.adharNumber,
      SenderMobile: this.senderForm.value.mobileNumber,
      latitude: this.authServiceobj.getUserLat(),
      longitude: this.authServiceobj.getUserLongtitude(),
      biometricdata: bioData,
      ConsentId: "c3"
    };

    this._MoneyTransferService.PPIValidateAadharBiometric(payload).subscribe(res => {
      if (res.Status_Code == "1") {
        this.toastr.success("Biometric Verified");
        this.isLoading = false;
        this.validatePpiPan();
      } else {
        this.toastr.error(res.Message);
        this.isLoading = false;
      }
    });

  }



  private finalizeTramoSender() {
    this.isLoading = true;

    const mobile = this.senderForm.value.mobileNumber;
    const otp = this.tramoOTP.trim();

    if (!otp) {
      this.toastr.error('Please enter OTP');
      this.isLoading = false;
      return;
    }

    this._MoneyTransferService.validateTramoSenderOtp(
      mobile,
      otp,
      this.tramoState,
      this.authServiceobj.getSessionKey()
    ).subscribe({
      next: (res) => {
        if (res.Status_Code === "1") {
          Swal.fire({
            icon: 'success',
            title: 'Sender Created',
            html: res.Message,
            confirmButtonText: 'OK'
          });

          this.modalService.dismissAll();
          this.ResetSenderForm();
        } else {
          this.toastr.error(res.Message);
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Server Error');
        this.isLoading = false;
      }
    })
  }


  FinalBeneForCreation() {

    if (this.selectedService === 'TRAMO') {
      this._MoneyTransferService.addBeneficiary_TRAMO(
        this.authServiceobj.getSessionKey(),
        this.mobileNumber,   // Sender Mobile
        this.beneficiaryForm.get('accountNumber')?.value,
        this.beneficiaryForm.get('ifscCode')?.value,
        this.getBankName(this.beneficiaryForm.get('branchName')?.value),
        this.beneficiaryForm.get('beneficiaryNumber')?.value
      ).subscribe({
        next: (res: any) => {
          if (res.Status_Code === "1") {
            this.modalService.dismissAll();
            this.ResetBenefForm();

            Swal.fire({
              icon: 'success',
              title: 'Beneficiary Created',
              text: res.Message
            });

            this.loadTramoBeneficiaries();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Failed',
              text: res.Message
            });
          }
          this.isLoading = false;
        },
        error: () => {
          this.toastr.error('Server Error');
          this.isLoading = false;
        }
      });

      return;
    }

    if (this.selectedService === 'FINO') {
      this.isLoading = true;
      const otp = this.beneficiaryForm.get('otp')?.value;
      const benePayload = {
        BeneName: this.beneficiaryForm.get('beneficiaryNumber')?.value,
        AccountNo: this.beneficiaryForm.get('accountNumber')?.value,
        IFSCCode: this.beneficiaryForm.get('ifscCode')?.value,
        BankName: this.getBankName(this.beneficiaryForm.get('branchName')?.value),
      };

      this._MoneyTransferService.addBeneficiary(
        this.mobileNumber,
        benePayload,
        this.senderId
      ).subscribe((res: any) => {
        if (res.Status_Code === "1") {
          this.modalService.dismissAll();
          this.ResetBenefForm();
          Swal.fire({
            icon: 'success',
            title: 'Beneficiary Created',
            text: res.Message,
            confirmButtonText: 'OK'
          });
          this.loadBeneficiaries(); // ✅ refresh list
          this.isLoading = false;
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: res.Message,
          });
          this.isLoading = false;
        }
      });

    }

    if (this.selectedService === 'PPI') {
      this.isLoading = true;
      const req = {
        SessionKey: this.authServiceobj.getSessionKey(),
        SenderMobile: this.mobileNumber,
        APIKey: "PPI01",
        TokeyKey: this.PPI_TOKEYKEY,
        BeneName: this.beneficiaryForm.get('beneficiaryNumber')?.value,
        AccountNo: this.beneficiaryForm.get('accountNumber')?.value,
        IfscCode: this.beneficiaryForm.get('ifscCode')?.value,
        BankName: this.getBankName(this.beneficiaryForm.get('branchName')?.value)
      };
      this.isLoading = true;
      this._MoneyTransferService.PPIAddBeneficiary(req).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.Status_Code === "1") {
            this.toastr.success("Beneficiary added successfully!");
            this.ResetBenefForm();
            this.modalService.dismissAll();
            this.loadPPIBeneficiaries();
          } else {
            this.toastr.error(res.Message || "Failed to add beneficiary");
          }
        },
        error: () => {
          this.isLoading = false;
          this.toastr.error("Server error");
        }
      });

    }
  }

  getBankName(code: string): string {
    const bank = this.banks.find(b => b.BankId === code);
    return bank ? bank.Bankname : '';
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

    this.fingerprintProcess = false;
    this.otpverification = false;
    this.tramoOTP = "";
  }

  ResendOTPForPayment() {
    this.sendOtpForPayment();
  }

  ResendOTPForBenf() {

    const accountNo = this.beneficiaryForm.get('accountNumber')?.value;
    const beneName = this.beneficiaryForm.get('beneficiaryNumber')?.value;
    const ifscCode = this.beneficiaryForm.get('ifscCode')?.value;
    this.requestSenderOtp(
      this.mobileNumber.trim(),
      this.senderName.trim(),
      '0',
      beneName,
      accountNo,
      ifscCode,
      false,
      false
    );
  }


  Pay(bene: any) {
    this.isLoading = true;
    console.log('Pay clicked for:', bene);
    this.currentBeneId = bene.Id || bene.beneId;
    this.currentBeneName = bene.BeneName;
    this.currentBankId = bene.AccountNo;
    this.currentBankName = bene.BankName;
    this.currentBankIfscCode = bene.IFSCCode;

    this.benedet = bene;
    const payload = {
      senderId: this.senderId,
      accountNo: bene.AccountNo,
      ifsc: bene.IFSCCode,
      beneName: bene.BeneName
    };
    if (this.selectedService === "FINO") {
      this.sendOtpForPayment();
      this.validateOTPforPayment = false;
    }

  
    this.modalService.open(this.previewModalobj, { size: 'lg', backdrop: 'static', keyboard: false });
    this.isLoading = false;
  }


  DeleteBene(bene: any) {

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete beneficiary: ${bene.BeneName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {

        const payload = {
          SessionKey: this.authServiceobj.getSessionKey(),
          APIKey: "DelBene001",
          SenderMobile: bene.SenderMobile,
          BeneId: bene.Id
        };

        this._MoneyTransferService.DeleteBeneficiary(payload)
          .subscribe({
            next: (res: any) => {

              if (res.status === "SUCCESS" || res.Status_Code === "1") {

                Swal.fire({
                  icon: 'success',
                  title: 'Deleted!',
                  text: 'Beneficiary has been deleted.'
                });

                // 🔥 Remove beneficiary from UI without refreshing the list
                this.beneficiaries = this.beneficiaries.filter(b => b.Id !== bene.Id);

              } else {

                Swal.fire({
                  icon: 'error',
                  title: 'Failed!',
                  text: res.message || 'Unable to delete beneficiary.'
                });

              }
            },
            error: () => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Something went wrong while deleting beneficiary.'
              });
            }
          });

      }

    });
  }

  loadBanks() {
    const payload = {
      SessionKey: this.authServiceobj.getSessionKey(),
      APIKey: "GetBank001"
    }
    this._MoneyTransferService.getBankList(payload).subscribe((res: any) => {
      if (res.Status_Code === "1") {
        this.banks = res.Data;
      }
    });
  }

  onBankSelect(bank: any) {
    this.beneficiaryForm.patchValue({
      ifscCode: bank.Ifsc
    });
  }

  ValidateBankDetails() {
    this.isLoading = true;
    const form = this.beneficiaryForm.value;

    const payload = {
      SessionKey: this.authServiceobj.getSessionKey(),
      APIKey: "AccountVarify001",
      SenderMobile: this.mobileNumber.toString(),
      BeneName: form.beneficiaryNumber.toString(),
      AccountNo: form.accountNumber.toString(),
      IfscCode: form.ifscCode.toString(),
      BankName: this.getBankName(this.beneficiaryForm.get('branchName')?.value) || ""   // from dropdown
    };

    this._MoneyTransferService.verifyAccount(payload).subscribe((res: any) => {

      if (res.Status_Code === "1") {
        const beneName = res.Data[0].BeneName;
        this.beneficiaryForm.patchValue({
          beneficiaryNumber: beneName
        });

        this.toastr.success("✅ Account Verified Successfully.");
        this.validatebankdetails = true;
        this.isLoading = false;

      } else {
        this.toastr.error("❌ " + res.Message);
        this.isLoading = false;
      }

    });
  }

  sendOtpForPayment() {
    this.isLoading = true;
    const senderMobile = this.mobileNumber;
    const senderName = this.senderName;
    this.requestSenderOtp(
      senderMobile,
      senderName,
      "5",
      this.currentBeneName,
      this.currentBankId,
      this.currentBankIfscCode,
      false,
      false
    );
    this.isLoading = false;
  }

  sendOtpForPaymentForPPI() {
    this.isLoading = true;
    const senderMobile = this.mobileNumber;
    const senderName = this.senderName;
    this._MoneyTransferService.PPISendPaymentOTP(
      this.authServiceobj.getSessionKey(),
      "PPI01",
      this.PPI_TOKEYKEY,
      this.mobileNumber,
      this.benedet.beneId || this.benedet.BeneId,
      (document.getElementById('amount') as HTMLInputElement).value || "0",
      this.benedet.accountNo || this.benedet.AccountNo,
      this.benedet.ifsCcode || this.benedet.IFSCCode
    )
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.Status_Code === "1") {
            this.toastr.success(res.Message);
            this.ppiPaymentOtpToken = res.Data;
            this.showPPIPaymentOtpBlock = true;
          }
          else {
            this.toastr.warning(res.Message || "Unable to send OTP");
          }
        },

        error: () => {
          this.isLoading = false;
          this.toastr.error("Error sending payment OTP");
        }
      });
    this.isLoading = false;
  }

  onAmountEntered() {
    if (this.selectedService !== 'PPI') return;
   
    this.sendOtpForPaymentForPPI();
  }


  submitMoneyTransfer() {


    this.isLoading = true;
    this.invoicemobno= this.mobileNumber;
    const txnType = (document.getElementById('txnType') as HTMLSelectElement).value;
    const amount = (document.getElementById('amount') as HTMLInputElement).value;

    if (amount == "" || amount == "0") {
      this.toastr.error("Please enter valid Amount");
      this.isLoading = false;
      return;
    }

    if (this.selectedService === "FINO") {
      if (!this.enteredPaymentOTP || this.enteredPaymentOTP.length !== 4) {
        this.toastr.error("Please enter valid OTP");
        this.isLoading = false;
        return;
      }

    }

    if (this.selectedService === "TRAMO") {
      if (!this.enteredMPIN || this.enteredMPIN.length != 4) {
        this.toastr.error("Please enter valid Transaction PIN");
        this.isLoading = false;
        return;
      }
    }

    if (this.selectedService === "PPI") {
      if (!this.enteredPaymentOTPForPPI || this.enteredPaymentOTPForPPI == "") {
        this.toastr.error("Please enter valid OTP");
        this.isLoading = false;
        return;
      }
    }


    this._MoneyTransferService.getLocation().then(({ latitude, longitude }) => {

      

      let payload: any;
      if (this.selectedService === "FINO") {
        payload = {
          SessionKey: this.authServiceobj.getSessionKey(),
          APIKey: "MoneyTransfer001",
          Sendermobile: this.mobileNumber,
          SenderName: this.senderName,

          BeneName: this.currentBeneName,
          AccountNo: this.currentBankId,
          IfscCode: this.currentBankIfscCode,
          BeneId: this.currentBeneId,

          Amount: amount,
          TXNMode: txnType,
          BankName: this.currentBankName,

          langtitude: longitude,
          latitute: latitude,

          MerchantMobileNo: this.merchantMobile,
          Otprequestid: this.otpRequestId,
          OTP: this.enteredPaymentOTP
        };

        this._MoneyTransferService.moneyTransfer(payload).subscribe({
          next: (res: any) => {
            this.isLoading = false;

            if (res.Status_Code === "1") {
              this.toastr.success("Transaction Successful");
              this.enteredPaymentOTP = "";
              this.amount = "";
              this.otpRequestId = "";
              this.invoiceData = {
                AccountNo: res?.Data[0]?.AccountNo,
                Amount: res?.Data[0]?.Amount,
                BR_Id: res?.Data[0]?.BR_Id,
                BeneName: res?.Data[0]?.BeneName,
                Status: res?.Data[0]?.Status,
                TxnDate: res?.Data[0]?.TxnDate,
                TxnID: res?.Data[0]?.TxnID,
                CurrentBalance: res?.Data[0]?.CurrentBalance
              };
              this.modalService.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false });

            } else {
              this.toastr.error(res.Message || "Transaction Failed");
            }
          },
          error: () => {
            this.isLoading = false;
            this.toastr.error("Server Error");
          }
        });
      }

      if (this.selectedService === "TRAMO") {
        payload = {
          SessionKey: this.authServiceobj.getSessionKey(),
          APIKey: "MoneyTransfer001",
          Sendermobile: this.mobileNumber,
          BeneName: this.currentBeneName,
          AccountNo: this.currentBankId,
          IfscCode: this.currentBankIfscCode,
          BankName: this.currentBankName,
          BeneId: this.currentBeneId,
          Amount: amount,
          DMTTYPE: "DMT2",
          TXNMode: txnType,
          MPIN: this.enteredMPIN
        };

        this._MoneyTransferService.TramomoneyTransfer(payload).subscribe({

          next: (res: any) => {
            this.isLoading = false;
            this.enteredMPIN = "";
            if (res.Status_Code === "1") {
              this.toastr.success("Transaction Successful");
              this.enteredPaymentOTP = "";
              this.amount = "";
              this.otpRequestId = "";
              this.invoiceData = {
                AccountNo: res?.Data[0]?.AccountNo,
                Amount: res?.Data[0]?.Amount,
                BR_Id: res?.Data[0]?.BR_Id,
                BeneName: res?.Data[0]?.BeneName,
                Status: res?.Data[0]?.Status,
                TxnDate: res?.Data[0]?.TxnDate,
                TxnID: res?.Data[0]?.TxnID,
                CurrentBalance: res?.Data[0]?.CurrentBalance,
              };
              this.modalService.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false });

            } else {
              this.toastr.error(res.Message || "Transaction Failed");
            }
          },
          error: () => {
            this.isLoading = false;
            this.toastr.error("Server Error");
          }

        });
        return;
      }

      if (this.selectedService === "PPI") {
        payload = {
          SessionKey: this.authServiceobj.getSessionKey(),
          APIKey: "MoneyTransfer001",
          TokeyKey: this.PPI_TOKEYKEY,
          Sendermobile: this.mobileNumber,
          BeneName: this.currentBeneName,
          AccountNo: this.currentBankId,
          IfscCode: this.currentBankIfscCode,
          BankName: this.currentBankName,
          BeneId: this.currentBeneId,
          Amount: amount,
          TXNMode: txnType,
          otpToken: this.ppiPaymentOtpToken,
          OTP: this.enteredPaymentOTPForPPI
        };
        this._MoneyTransferService.PPIMoneyTransfer(payload).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            this.enteredPaymentOTPForPPI = "";
            if (res.Status_Code === "1") {
              this.toastr.success("Transaction Successful");
              this.amount = "";
              this.invoiceData = {
                AccountNo: res?.Data[0]?.AccountNo,
                Amount: res?.Data[0]?.Amount,
                BR_Id: res?.Data[0]?.BR_Id,
                BeneName: res?.Data[0]?.BeneName,
                Status: res?.Data[0]?.Status,
                TxnDate: res?.Data[0]?.TxnDate,
                TxnID: res?.Data[0]?.TxnID,
                CurrentBalance: res?.Data[0]?.CurrentBalance
              };

              this.modalService.open(this.invoiceModal, {
                size: 'lg',
                backdrop: 'static',
                keyboard: false
              });

            } else {
              this.toastr.error(res.Message || "Transaction Failed");
            }
          },
          error: () => {
            this.isLoading = false;
            this.toastr.error("Server Error");
          }

        });
        return;
      }


    })
  }


  printInvoice() {
    const content = document.getElementById('invoiceContent');
    const printArea = document.getElementById('printArea');

    if (!content || !printArea) return;
    printArea.innerHTML =  content.innerHTML; 

    printArea.style.display = 'inline-block';

    window.print();

    setTimeout(() => {
      printArea.innerHTML = '';
      printArea.style.display = 'none';
    }, 500);
  }

  CancelMoneyTransfer() {
    this.amount = "";
    this.enteredPaymentOTP = "";
    this.enteredMPIN = "";
    this.panCardNo = "";
    this.aadharOtpInput = "";
    this.selectedKycType = "";
    this.PPI_EnteredOTPFlag = false;
    this.PPI_EnteredOTP = "";
    this.modalService.dismissAll();

  }

  selectedKycTypeChanged() {

    this.otpverification = false;
    this.fingerprintProcess = false;
    this.fingerprintSuccess = false;
    this.tramoOTP = "";

    if (this.selectedService === "PPI" && this.selectedKycType === "OTP") {
      this.selectedKycType = "OTP";
      return;
    }

    if (this.selectedService === "PPI" && this.selectedKycType === "BIOMETRIC") {
      this.selectedKycType = "BIOMETRIC";
      return;
    }

    if (this.selectedService === "TRAMO" || this.selectedService === "FINO") {
      this.showPPIOtpBlock = false;
      this.showPPIBiometricBlock = false;
      this.fingerprintProcess = false;
      this.otpverification = false;
      this.fingerprintSuccess = false;
      return;
    }
  }

}
