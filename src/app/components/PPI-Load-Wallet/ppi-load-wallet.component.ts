import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import html2pdf from 'html2pdf.js';
import { LoaderComponent } from '../app-loader/loader.component';
import { AuthService } from '../../services/auth.service';
import { MoneyTransferService } from '../../services/money-transfer.service';
import { MasterService, ServiceStatusResponse } from '../../services/master.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { PidConfig, PID_OPTIONS_CONFIG } from '../../services/pid-options.config';

type Step = 'mobile' | 'otp' | 'create-sender' | 'load-wallet' | 'invoice';
type KycType = 'OTP' | 'BIOMETRIC' | '';
type CreateSenderSubStep = 'form' | 'aadhar-otp-sent';

@Component({
  selector: 'app-ppi-load-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './ppi-load-wallet.component.html',
  styleUrls: ['./ppi-load-wallet.component.scss']
})
export class PpiLoadWalletComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Step management
  currentStep: Step = 'mobile';
  kycType: KycType = '';
  createSenderSubStep: CreateSenderSubStep = 'form';

  isLoading = false;

  // Sender check
  mobileNumber = '';
  otpToken = '';
  enteredOtp = '';

  // After VerifyOtp
  tokeyKey = '';
  applicationNumber = '';
  walletStatus = '';
  walletCurrentBalance = '';
  walletLimit = '';
  senderName = '';

  // Create Sender – Aadhar OTP flow
  aadharNo = '';
  panCardNo = '';
  aadharToken = '';
  aadharOtp = '';

  // Create Sender – Biometric flow
  selectedDevice = '';
  fingerprintXml = '';
  fingerprintCaptured = false;
  finalUrl = '';
  MethodCapture = '';
  MethodInfo = '';

  devices: { id: string; label: string; icon: string }[] = [
    { id: 'Mantra', label: 'Mantra L1', icon: 'myntra.png' },
    { id: 'Morpho', label: 'Morpho L1', icon: 'morpho.jpg' },
    { id: 'Startek', label: 'Startek L1', icon: 'Startek.jpg' }
  ];

  // Load Wallet
  amount = '';
  txnPin = '';
  showPin = false;

  // Invoice
  invoiceData: any = null;

  constructor(
    private toastr: ToastrService,
    private _MoneyTransferService: MoneyTransferService,
    private masterService: MasterService
  ) {}

  ngOnInit() {
    const userId = this.authService.getUserId();
    const userName = this.authService.getUsername();
    if (!userId || !userName) {
      Swal.fire('Validation', 'Session expired. Please login.', 'warning');
      this.router.navigate(['/login']);
      return;
    }
    this.checkServiceStatus(Number(userId));
  }

  checkServiceStatus(userId: number): void {
    this.masterService.checkServiceStatus('PPI Load Wallet', userId).subscribe({
      next: (res: ServiceStatusResponse) => {
        const userType = this.authService.getUsertype();
        if (userType !== 'Retailer') {
          Swal.fire({
            title: 'Attention!',
            text: 'This page is not accessible. Please contact admin.',
            icon: 'warning',
            confirmButtonColor: '#5e2f82'
          }).then(() => this.router.navigate(['/dashboard']));
        }
      },
      error: () => {}
    });
  }

  // ── STEP 1: Send OTP ──────────────────────────────────────────────────────

  sendOtp(): void {
    if (!this.mobileNumber || this.mobileNumber.length !== 10) {
      this.toastr.error('Please enter a valid 10-digit mobile number');
      return;
    }
    this.isLoading = true;
    this._MoneyTransferService.checkPPISender(
      this.authService.getUserId(),
      this.mobileNumber,
      this.authService.getUserPincode() || '261141',
      this.authService.getUsername() || 'Agent'
    ).subscribe({
      next: (res) => {
        if (res.status_Code === '1') {
          this.otpToken = res.data;
          this.enteredOtp = '';
          this.currentStep = 'otp';
          this.toastr.success(res.message || 'OTP sent successfully');
        } else {
          this.toastr.error(res.message || 'Failed to send OTP');
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Server error. Please try again.');
        this.isLoading = false;
      }
    });
  }

  // ── STEP 2: Verify OTP ────────────────────────────────────────────────────

  verifyOtp(): void {
    if (!this.enteredOtp || this.enteredOtp.length < 4) {
      this.toastr.error('Please enter the OTP');
      return;
    }
    this.isLoading = true;
    this._MoneyTransferService.validatePPIOtp(
      this.authService.getUserId(),
      this.otpToken,
      this.enteredOtp
    ).subscribe({
      next: (res) => {
        if (res.status_Code === '1') {
          const data = res.data[0];
          this.tokeyKey = data.tokeyKey;
          this.applicationNumber = data.applicationNumber;
          this.walletStatus = data.walletStatus;
          this.walletCurrentBalance = data.walletCurrentBalance || '0';
          this.walletLimit = data.walletLimit || '0';
          this.senderName = data.senderName || '';

          if (data.walletStatus === 'true') {
            this.toastr.success('Sender verified successfully!');
            this.currentStep = 'load-wallet';
          } else {
            this.toastr.info('Sender not registered. Please complete KYC to continue.');
            this.kycType = '';
            this.createSenderSubStep = 'form';
            this.currentStep = 'create-sender';
          }
        } else {
          this.toastr.error(res.message || 'OTP Verification Failed');
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('OTP validation failed. Please try again.');
        this.isLoading = false;
      }
    });
  }

  // ── STEP 3a: Aadhar OTP – Generate OTP ───────────────────────────────────

  generateAadharOtp(): void {
    if (!this.aadharNo || this.aadharNo.length !== 12) {
      this.toastr.error('Please enter a valid 12-digit Aadhar number');
      return;
    }
    this.isLoading = true;
    this._MoneyTransferService.PPISendAadharOTP({
      userId: this.authService.getUserId(),
      apiKey: 'PPI01',
      tokeyKey: this.tokeyKey,
      aadharNo: this.aadharNo,
      consentId: 'c3',
      applicationNumber: this.applicationNumber,
      pincode: this.authService.getUserPincode() || '261141',
      rtName: this.authService.getUsername() || 'Agent'
    }).subscribe({
      next: (res) => {
        if (res.status_Code === '1') {
          this.aadharToken = res.data;
          this.aadharOtp = '';
          this.createSenderSubStep = 'aadhar-otp-sent';
          this.toastr.success(res.message || 'Aadhar OTP sent successfully');
        } else {
          this.toastr.error(res.message || 'Failed to generate Aadhar OTP');
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Server error. Please try again.');
        this.isLoading = false;
      }
    });
  }

  validatePan(): void {
    if (!this.panCardNo || this.panCardNo.length !== 10) {
      this.toastr.error('Please enter a valid 10-character PAN number');
      return;
    }
    this.isLoading = true;
    this._MoneyTransferService.PPIValidatePan({
      userId: this.authService.getUserId(),
      apiKey: 'PPI01',
      tokeyKey: this.tokeyKey,
      pancardNo: this.panCardNo.toUpperCase(),
      applicationNumber: this.applicationNumber,
      pincode: this.authService.getUserPincode() || '261141',
      rtName: this.authService.getUsername() || 'Agent'
    }).subscribe({
      next: (res) => {
        if (res.status_Code === '1') {
          this.toastr.success(res.message || 'PAN Verified');
        } else {
          this.toastr.warning(res.message || 'PAN Verification failed');
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('PAN validation error');
        this.isLoading = false;
      }
    });
  }

  // ── STEP 3a: Aadhar OTP – Validate OTP ───────────────────────────────────

  validateAadharOtp(): void {
    if (!this.aadharOtp || this.aadharOtp.length < 4) {
      this.toastr.error('Please enter the Aadhar OTP');
      return;
    }
    this.isLoading = true;
    this._MoneyTransferService.PPIValidateAadharOTP({
      userId: this.authService.getUserId(),
      apiKey: 'PPI01',
      aadharToken: this.aadharToken,
      applicationNumber: this.applicationNumber,
      otp: this.aadharOtp,
      senderMobile: this.mobileNumber,
      tokeyKey: this.tokeyKey
    }).subscribe({
      next: (res) => {
        if (res.status_Code === '1') {
          this.toastr.success(res.message || 'Sender Registered! Please verify mobile again to load wallet.');
          this.resetForReVerify();
        } else {
          this.toastr.error(res.message || 'Aadhar OTP verification failed');
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Server error. Please try again.');
        this.isLoading = false;
      }
    });
  }

  // ── STEP 3b: Biometric ────────────────────────────────────────────────────

  selectDevice(deviceId: string): void {
    this.selectedDevice = deviceId;
  }

  async startBiometricCapture(): Promise<void> {
    if (!this.aadharNo || this.aadharNo.length !== 12) {
      this.toastr.error('Please enter a valid 12-digit Aadhar number');
      return;
    }
    if (!this.selectedDevice) {
      this.toastr.error('Please select a fingerprint device');
      return;
    }
    this.isLoading = true;
    try {
      const xml = await this.captureRdData(this.selectedDevice as 'Mantra' | 'Morpho' | 'Startek');
      this.fingerprintXml = xml;
      this.fingerprintCaptured = true;
      this.toastr.success('Fingerprint captured successfully');
      await this.submitBiometricRegistration();
    } catch (err: any) {
      this.toastr.error(err.message || 'Fingerprint capture failed');
      this.isLoading = false;
    }
  }

  private async submitBiometricRegistration(): Promise<void> {
    const { latitude, longitude } = await this._MoneyTransferService.getLocation();
    this._MoneyTransferService.PPIValidateAadharBiometric({
      userId: this.authService.getUserId(),
      apiKey: 'PPI01',
      tokeyKey: this.tokeyKey,
      applicationNumber: this.applicationNumber,
      pincode: this.authService.getUserPincode() || '261141',
      rtName: this.authService.getUsername() || 'Agent',
      aadharNo: this.aadharNo,
      senderMobile: this.mobileNumber,
      latitude: latitude,
      longitude: longitude,
      biometricdata: this.fingerprintXml,
      consentId: 'C3'
    }).subscribe({
      next: (res) => {
        if (res.status_Code === '1') {
          this.toastr.success(res.message || 'Sender Registered! Please verify mobile again to load wallet.');
          this.resetForReVerify();
        } else {
          this.toastr.error(res.message || 'Biometric registration failed');
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Server error during biometric registration');
        this.isLoading = false;
      }
    });
  }

  // ── STEP 4: Load Wallet ───────────────────────────────────────────────────

  loadWallet(): void {
    if (!this.amount || Number(this.amount) < 1) {
      this.toastr.error('Please enter a valid amount');
      return;
    }
    if (!this.txnPin) {
      this.toastr.error('Please enter your transaction PIN');
      return;
    }
    this.isLoading = true;
    this._MoneyTransferService.PPILoadWallet({
      userId: this.authService.getUserId(),
      apiKey: 'PPI01',
      sendermobile: this.mobileNumber,
      amount: this.amount,
      tokeyKey: this.tokeyKey,
      comingFrom: 'web',
      txnPin: this.txnPin
    }).subscribe({
      next: (res) => {
        if (res.status_Code === '1') {
          this.invoiceData = res.data[0];
          this.currentStep = 'invoice';
          this.toastr.success(res.message || 'Transaction Successful!');
        } else {
          this.toastr.error(res.message || 'Transaction Failed');
        }
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Transaction failed. Please try again.');
        this.isLoading = false;
      }
    });
  }

  // ── Invoice ───────────────────────────────────────────────────────────────

  downloadInvoice(): void {
    const el = document.getElementById('ppiInvoiceContent');
    if (el) {
      html2pdf().set({
        filename: `PPI_LoadWallet_${this.invoiceData?.txnID || 'Invoice'}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(el).save();
    }
  }

  printInvoice(): void {
    const printArea = document.getElementById('ppiPrintArea');
    const content = document.getElementById('ppiInvoiceContent');
    if (printArea && content) {
      printArea.innerHTML = content.outerHTML;
      printArea.style.display = 'block';
      window.print();
      printArea.style.display = 'none';
      printArea.innerHTML = '';
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private resetForReVerify(): void {
    this.currentStep = 'mobile';
    this.enteredOtp = '';
    this.otpToken = '';
    this.tokeyKey = '';
    this.applicationNumber = '';
    this.aadharNo = '';
    this.aadharOtp = '';
    this.aadharToken = '';
    this.panCardNo = '';
    this.kycType = '';
    this.createSenderSubStep = 'form';
    this.fingerprintCaptured = false;
    this.selectedDevice = '';
    this.fingerprintXml = '';
  }

  reset(): void {
    this.resetForReVerify();
    this.mobileNumber = '';
    this.walletStatus = '';
    this.walletCurrentBalance = '';
    this.walletLimit = '';
    this.senderName = '';
    this.amount = '';
    this.txnPin = '';
    this.invoiceData = null;
  }

  buildPidXml(config: PidConfig): string {
    const attrs = Object.entries(config)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    return `<PidOptions ver="1.0"> <Opts ${attrs}/> </PidOptions>`;
  }

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
      this.finalUrl = primaryUrl + port;
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
        await fetch(deviceInfoUrl, { method: 'DEVICEINFO', mode: 'cors' });
      }

      const config = PID_OPTIONS_CONFIG['PPI']['EKYC'];
      const pidXml = this.buildPidXml(config);
      const captureUrl = this.buildFullUrl(this.MethodCapture, isHttps);

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

      this.isLoading = false;

      const errorCodes = ['700', '720', '1001', '2100', '740', '214', '10', '28', '4001', '207', '6', '216', '571', '4003', '215', '52'];
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
}
