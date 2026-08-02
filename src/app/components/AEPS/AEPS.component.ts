import { Component, signal, ViewChild, inject, NgZone, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, debounceTime, distinctUntilChanged, map, retry, switchMap } from 'rxjs';
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
import { AEPSService } from '../../services/aeps.service';
import { BankService } from '../../services/bank.service';
import { MasterService, ServiceStatusResponse } from '../../services/master.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FinoAepsRequest, FinoMerchantEKYCRequest } from '../../models/FinoDailyLoginResponse';
import { BankModel } from '../../models/BankModel';
import { PidConfig, PID_OPTIONS_CONFIG } from '../../services/pid-options.config';
import { NgSelectModule } from '@ng-select/ng-select';
import { JIODailyTokenResponse } from '../../models/FinoDailyLoginResponse';
import { AdminFeature, AdminProvider } from '../../models/AdminFeature'
import { AdminConfigService } from '../../services/admin.service';
import { firstValueFrom } from 'rxjs';
import { dobValidator } from '../../services/Validator/dob.validator';


@Component({
  selector: 'app-AEPS',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTypeaheadModule, NgbToastModule, LoaderComponent, NgSelectModule],
  templateUrl: './AEPS.component.html',
  styleUrls: ['./AEPS.component.scss']
})
export class AEPSComponent {


  @ViewChild('invoiceModal') invoiceModal: any;

  constructor(private modalService: NgbModal, private toastr: ToastrService, private operatorService: OperatorService, private masterService: MasterService, private fb: FormBuilder, private zone: NgZone, private _adminconfig: AdminConfigService) { }

  private rechargeService = inject(RechargeService);
  private authServiceobj = inject(AuthService);
  private aepsService = inject(AEPSService);
  private router = inject(Router);
  private bankService = inject(BankService);
  selectedService: string = '';
  selectedAEPSChannelKey: string = '';
  selectedAEPSProvider: string = '';  // FINO / JPB
  selectedAEPSLabel: string = '';
  selectedicon: string = '';
  showRecentTxns = false;
  isDailyRegistrationPopupVisible = false;
  amount: any = null;
  dailyLoginForm!: FormGroup;
  dailyRegistrationFormFino!: FormGroup;
  JPBdailyLoginForm!: FormGroup;
  JPBAgentRegistrationForm!: FormGroup;
  JPBAgentEKYCForm!: FormGroup;
  sessionKey: string = "Ue3+U37PTedaLzeWuzX+DGJQJL3nGv5pPO+K3dVOrWU=";
  isDailyLoginPopupVisible: boolean = false;
  latitude: string = "";
  longitude: string = "";
  invoiceData: any = null;

  showAgentLoginModalJPB = false;
  showAgentRegistrationModalJPB = false;
  fingurdataKYCforJPB = false;
  applicationNumber: string = "";
  accessToken: string = "";
  appIdentifierToken: string = "";
  isEKYCProceedForFino: boolean = false;

  //For KYC
  capturedPidXmlForKYC: string = "";
  stateList: any[] = [];

  //END


  services: AdminFeature[] = [];
  aepschannels: AdminProvider[] = [];


  // services = [
  //   { key: 'WITHDRAW', label: 'Cash Withdrawal', icon: 'bi-cash-stack' },
  //   { key: 'PREPAID', label: 'Balance Enquiry', icon: 'bi-phone' },
  //   { key: 'STATEMENT', label: 'Mini Statement', icon: 'bi-receipt-cutoff' }
  // ];

  // aepschannels = [
  //   { key: 'AEPSCHANNEL2', label: 'JPB AEPS', icon: 'bi-fingerprint', provider: 'JPB' },
  //   { key: 'AEPSCHANNEL1', label: 'FINO AEPS', icon: 'bi-fingerprint', provider: 'FINO' }

  // ];
  banks: BankModel[] = [];
  selectedBank: string = "";




  async ngOnInit() {
    this.isLoading = true;
    const serviceCode = 'AEPS'; // replace with dynamic service code if needed
    await this.loadServicesAndProviders(serviceCode);
    this.sessionKey = this.authServiceobj.getSessionKey();
    const userId = this.authServiceobj.getUserId();
    const userName = this.authServiceobj.getUsername();

    if (!userId || !userName) {
      this.toastr.error('Session expired. Please login.');
      this.router.navigate(['/login']);
      return;
    }

    this.CheckServiceStatus(Number(userId), userName)

    if (this.selectedAEPSProvider === 'FINO') {
      this.loadBanks();
      this.checkDailyLoginFino();
      this.mobileNumber = '';
    }

    if (this.selectedAEPSProvider === 'JPB') {

      this.loadBanksForJPB();
      this.checkDailyLoginJPB();
    }
    this.initDailyLoginForm();
    this.initDailyLoginFormForJPB();
    this.initAgentRegistrationFormForJPB();
    this.getLocation();
    this.initAgentEKYCFormJPB();
    this.getStates();
    var d = this.JPBdailyLoginForm.value;
    d.mobileno = this.authServiceobj.getUserPhoneNo();
    d.agentrefno = this.authServiceobj.getAgentLoginId();
    this.isLoading = false;

  }

  async filterFeaturesByProvider(providerCode: string) {

    const featuresPromise = firstValueFrom(this._adminconfig.getFeatures("AEPS"));
    const [features] = await Promise.all([featuresPromise]);
    const safeFeatures = features ?? [];
    this.services = safeFeatures.filter(f => f.isEnabled);

    this.services = this.services.filter(f => f.providerCode === providerCode);

    if (this.services.length > 0) {
      this.onTabSelect(this.services[0].label);
    }
  }


  async loadServicesAndProviders(serviceCode: string): Promise<void> {
    try {
      // Convert observables to promises
      const featuresPromise = firstValueFrom(this._adminconfig.getFeatures(serviceCode));
      const providersPromise = firstValueFrom(this._adminconfig.getProviders(serviceCode));

      const [features, providers] = await Promise.all([featuresPromise, providersPromise]);

      // Use empty array fallback if undefined
      const safeFeatures = features ?? [];
      const safeProviders = providers ?? [];

      // Set services
      this.services = safeFeatures.filter(f => f.isEnabled);
      if (this.services.length > 0) {
        this.onTabSelect(this.services[0].label);
      }

      // Set providers/channels
      this.aepschannels = safeProviders.filter(p => p.isEnabled);
      if (this.aepschannels.length > 0) {
        this.selectedAEPSChannelKey = this.aepschannels[0].key;
        this.selectedAEPSProvider = this.aepschannels[0].key;
        this.selectedAEPSLabel = this.aepschannels[0].label;
        this.filterFeaturesByProvider(this.selectedAEPSProvider);
      }
    } catch (error) {
      this.services = [];
      this.aepschannels = [];
    }
  }




  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = "28.6201416" //position.coords.latitude.toString();
          this.longitude = "76.9879671" //position.coords.longitude.toString();
        },
        (error) => {
          this.latitude = "0.0";
          this.longitude = "0.0";
        }
      );
    } else {
      this.latitude = "0.0";
      this.longitude = "0.0";
    }
  }

  loadBanks() {
    this.isLoading = true;
    this.bankService.getBankList().subscribe({
      next: (data) => {
        this.banks = data;
        this.isLoading = false;
      },
      error: (err) => {
      }
    });
  }

  loadBanksForJPB() {
    this.isLoading = true;
    this.bankService.getBankListForJPB().subscribe({
      next: (data) => {
        this.banks = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading bank list', err);
      }
    });
  }

  onTabSelect(service: string) {
    this.selectedService = service;
    this.selectedicon = this.selectedService === 'Balance Enquiry' ? 'bi-phone' : this.selectedService === 'Cash Withdrawal' ? 'bi-cash-stack'
      : this.selectedService === 'Cash Deposit' ? 'bi-wallet2' : this.selectedService === 'Mini Statement' ? 'bi-receipt-cutoff' :
        this.selectedService === 'Aadhar Pay' ? 'bi-fingerprint' : '';
    this.amount = null;
  }
  selectedTab() {
    return this.selectedService;
  }

  onTabSelectAEPSChannel(channel: any) {

    this.selectedAEPSChannelKey = channel.key;     // Unique channel key
    this.selectedAEPSProvider = channel.key;  // FINO or JPB
    this.selectedAEPSLabel = channel.label;        // For UI if needed
    if (this.selectedAEPSChannelKey === 'FINO') {
      this.selectedicon = 'FINO';
      this.loadBanks();
      this.checkDailyLoginFino();
      this.mobileNumber = '';
      this.filterFeaturesByProvider(this.selectedAEPSProvider);
    } else {
      this.selectedicon = 'JPB';
      this.loadBanksForJPB();
      this.checkDailyLoginJPB();
      this.mobileNumber = "";
      this.filterFeaturesByProvider(this.selectedAEPSProvider);
    }
    console.log("Selected Channel Key:", this.selectedAEPSChannelKey);
    console.log("Using Provider:", this.selectedAEPSProvider);
  }

  initDailyLoginForm() {

    this.dailyLoginForm = this.fb.group({
      aadharno: [this.authServiceobj.getUserAadharNumber(), [Validators.required, Validators.pattern(/^\d{12}$/)]],
      mobileno: [this.authServiceobj.getUserPhoneNo(), [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    })

    this.dailyRegistrationFormFino = this.fb.group({
      FirstName: [this.authServiceobj.getUserName(), [Validators.required]],
      finoMiddleName: [''],
      LastName: ['', [Validators.required]],
      aadharno: [this.authServiceobj.getUserAadharNumber(), [Validators.required, Validators.pattern(/^\d{12}$/)]],
      mobileno: [this.authServiceobj.getUserPhoneNo(), [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      PANNo: [this.authServiceobj.getUserPanCard(), [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      NameAsPerPANNumber: ['', Validators.required],
      dob: ['', [Validators.required, dobValidator]]
    });
  }

  initDailyLoginFormForJPB() {
    this.JPBdailyLoginForm = this.fb.group({
      aadharno: [this.authServiceobj.getUserAadharNumber(), [Validators.required, Validators.pattern(/^\d{12}$/)]],
      mobileno: [this.authServiceobj.getUserPhoneNo(), [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      agentrefno: [this.authServiceobj.getUserPhoneNo(), Validators.required]
    });
  }

  formatDOB(event: any) {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length >= 2)
      value = value.substring(0, 2) + '/' + value.substring(2);

    if (value.length >= 5)
      value = value.substring(0, 5) + '/' + value.substring(5, 9);

    event.target.value = value;
    this.dailyLoginForm.get('finodob')?.setValue(value, { emitEvent: false });
  }


  showFormErrors(form: FormGroup) {
    Object.keys(form.controls).forEach(field => {
      const control = form.get(field);

      if (control?.errors) {
        if (control.errors['required']) {
          this.toastr.error(`${field} is required`);
        }
        if (control.errors['pattern']) {
          this.toastr.error(`Invalid ${field}`);
        }
        if (control.errors['minlength']) {
          this.toastr.error(`${field} is too short`);
        }
        if (control.errors['maxlength']) {
          this.toastr.error(`${field} is too long`);
        }
      }

      control?.markAsTouched();
    });
  }


  initAgentRegistrationFormForJPB() {
    this.JPBAgentRegistrationForm = this.fb.group({
      refNo: [this.authServiceobj.getUserPhoneNo(), Validators.required],
      pan: [
        this.authServiceobj.getUserPanCard(),
        [
          Validators.required,
          Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/) // PAN format
        ]
      ],
      mobile: [
        this.authServiceobj.getUserPhoneNo(),
        [
          Validators.required,
          Validators.pattern(/^[0-9]{10}$/) // 10-digit mobile
        ]
      ],
      email: [
        this.authServiceobj.getUserEmailId().trim(),
        [
          Validators.required,
          Validators.email
        ]
      ],
      address: [this.authServiceobj.getUserAddressLine1(), Validators.required],
      city: [this.authServiceobj.getUserCity(), Validators.required],
      state: ['', Validators.required],
      pincode: [
        this.authServiceobj.getUserPincode(),
        [
          Validators.required,
          Validators.pattern(/^[0-9]{6}$/) // 6-digit pincode
        ]
      ],
      accessToken: [''],
      appIdentifierToken: ['']
    });
  }


  initAgentEKYCFormJPB() {
    this.JPBAgentEKYCForm = this.fb.group({
      aadharNumber: ['']
    });
  }

  checkDailyLoginFino() {
    this.isLoading = true;
    this.aepsService.checkDailyLogin(this.sessionKey).subscribe(res => {
      if (res.Status_Code === "0" && res.Data === "PLEASE Daily Login") {
        this.openDailyLoginPopup();
      }
      else if (res.Status_Code === "2") {
        this.toastr.error(res.Message);
        this.router.navigate(['/login']);
      }
      this.isLoading = false;
    });
  }

  openDailyLoginPopup() {
    this.fingerprintSuccess = false;
    this.isDailyLoginPopupVisible = true;
  }

  closeDailyLoginPopup() {
    this.isDailyLoginPopupVisible = false;
  }

  closeDailyLoginPopupJPB() {
    this.showAgentLoginModalJPB = false;
  }

  closeDailyRegistrationPopup() {

    this.isDailyRegistrationPopupVisible = false;
    this.fingerprintSuccess = false;
  }


  submitDailyLogin() {


    if (this.dailyLoginForm.invalid) {
      this.showFormErrors(this.dailyLoginForm);
      return;
    }

    if (!this.fingerprintSuccess) {
      this.toastr.error("Please capture fingerprint first");
      return;
    }

    const f = this.dailyLoginForm.value;

    const requestPayload: FinoAepsRequest = {
      SessionKey: this.sessionKey,
      APIKey: "FinoAEPS001",
      aadharno: f.aadharno,
      bankiinno: '',
      mobileno: f.mobileno,
      amount: "0",
      txntype: this.isDailyLoginPopupVisible ? "dl" : "reg",
      BankName: '',
      latitude: this.latitude,
      longitude: this.longitude,
      fingerdata: this.capturedFingerData,
      DeviceSrNo: this.deviceSerialNumber,
      deviceType: this.selectedDevice,
      comingFrom: "Web",
    };
    this.isLoading = true;
    this.aepsService.finoLogin(requestPayload).subscribe(response => {

      if (response.Status_Code === "1") {
        this.toastr.success("Success!");

        if (this.isDailyLoginPopupVisible)
          this.closeDailyLoginPopup();
        else
          this.closeDailyRegistrationPopup();
      }
      else if (response.Status_Code === "2") {
        this.toastr.error(response.Message);
        this.router.navigate(['/login']);
      }
      else {
        this.toastr.error(response.Message);
        if (response?.Message?.toLowerCase()?.includes("hmac already exit,transaction aborted") || response?.Message?.toLowerCase()?.includes("pid conversion failed: invalid pid xml structure. missing required elements.") || response?.Message?.toLowerCase()?.includes("npci timeout, please try after sometime.(96)")) {
          this.fingerprintSuccess = false;
          this.originalFingerXml = "";
        }
      }
      this.isLoading = false;
    });
  }


  get colClass(): string {
    if (this.showRecentTxns) {
      return 'form-group';
    }
    const hasAmount = ['Cash Withdrawal', 'Cash Deposit', 'Aadhar Pay'].includes(this.selectedTab());
    return hasAmount ? 'col-md-3' : 'col-md-4';
  }

  get disableclass(): string {
    if (this.selectedAEPSProvider === 'FINO') {
      return 'disablecss'
    }
    else {
      return '';
    }
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
  capturedFingerData = '';
  deviceSerialNumber = '';
  isLoading = false;
  toastMessages: string[] = [];
  miniStatementList: any[] = [];

  showMobileError = false;
  showOperatorError = false;
  showAmountError = false;
  operatorList: any[] = [];
  originalFingerXml = '';

  errors = {
    mobileNumber: '',
    mobileOperator: '',
    mobileAadhar: ''
  };

  buildPidXml(config: PidConfig): string {
    const attrs = Object.entries(config)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");

    return `<PidOptions ver="1.0"> <Opts ${attrs}/> </PidOptions>`;
  }

  selectedDevice = '';

  devices: { id: string; label: string; icon: string }[] = [
    { id: 'Mantra', label: 'Mantra L1', icon: 'myntra.png' },
    { id: 'Morpho', label: 'Morpho L1', icon: 'morpho.jpg' },
    { id: 'Startek', label: 'Startek L1', icon: 'Startek.jpg' }
  ];

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



  CheckServiceStatus(userId: number, serviceName: string): void {
    this.masterService.checkServiceStatus("AEPS", userId).subscribe({
      next: (res: ServiceStatusResponse) => {
        console.log('Service Status Response:', res);
        const userType = this.authServiceobj.getUsertype();

        if (!res.userServiceActive || userType != 'Retailer') {

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
          Swal.fire({
            title: 'Attention!',
            text: "AEPS is down or not active. Please contact to admin",
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
      }
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
      const config = PID_OPTIONS_CONFIG[this.selectedAEPSProvider][this.fingurdataKYCforJPB ? "EKYC" : "BALANCE"];
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
  extractSrNo(xml: string): string {
    const match = xml.match(/srno="([^"]+)"/i);
    return match ? match[1] : "";
  }
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
        const qScoreAttr = resp?.getAttribute('qScore');
        if (errCode !== '0') {
          this.fingerprintSuccess = false;
          this.toastr.error('Device not ready / Finger Capture Failed');
          return;
        }
        if (qScoreAttr && qScoreAttr.trim() !== '') {
          const qScore = Number(qScoreAttr);
          if (!isNaN(qScore) && qScore < 40) {
            this.fingerprintSuccess = false;
            this.toastr.error('Finger Mismatch');
            return;
          }
        }
        this.originalFingerXml = xml;
        this.capturedFingerData = btoa(unescape(encodeURIComponent(xml)));
        this.deviceSerialNumber = this.extractSrNo(xml);
        this.fingerprintSuccess = true;
        this.toastr.success('Fingurprint Captured');
        this.selectedDevice = '';
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

    if (this.bankname == "") {
      this.toastr.error('Please Select Bank Name');
      return;
    }
    if (this.mobileNumber.toString() == "") {
      this.toastr.error('Please Enter Mobile Number');
      return;
    }
    if (this.mobileAadhar == "") {
      this.toastr.error('Please Enter Aadhar Number');
      return;
    }
    if (['Cash Withdrawal', 'Cash Deposit'].includes(this.selectedService)) {
      if (this.amount == "" || this.amount <= 0) {
        this.toastr.error('Please Enter Amount');
        return;
      }
    }

    this.modalService.open(modalContent, { centered: true, size: 'md', backdrop: 'static', keyboard: false });
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
      filename: 'AEPS_Transaction_Invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(clone).save();
    this.isLoading = false;
  }

  getBankName(nbin: string): string {
    const bank = this.banks.find(x => x.nbin === nbin);
    return bank ? bank.bankName : '';
  }

  FinoRegistrationPopupShow() {
    this.fingerprintSuccess = false;
    this.isDailyRegistrationPopupVisible = true;
    this.isDailyLoginPopupVisible = false;
  }

  ProceedForEKYCFino() {
    if (this.dailyRegistrationFormFino.invalid) {
      this.showFormErrors(this.dailyRegistrationFormFino);
      return;
    }
    this.isDailyRegistrationPopupVisible = true;
    this.isEKYCProceedForFino = true;
    this.fingurdataKYCforJPB = true;
    this.fingerprintSuccess = false;
  }

  CompleteForEKYCFino() {

    if (this.dailyRegistrationFormFino.invalid) {
      this.showFormErrors(this.dailyRegistrationFormFino);
      return;
    }

    if (!this.fingerprintSuccess) {
      this.toastr.error("Please capture fingerprint first");
      return;
    }

    const f = this.dailyRegistrationFormFino.value;

    const requestPayload: FinoMerchantEKYCRequest = {
      SessionKey: this.sessionKey,
      APIKey: "FinoAEPS001",
      aadharno: f.aadharno,
      NameasperPan: f.NameAsPerPANNumber,
      mobileno: f.mobileno,
      DOB: f.dob,
      Pancardno: f.PANNo,
      Firstname: f.FirstName,
      LastName: f.finoMiddleName + " " + f.LastName,
      fingerdata: this.capturedFingerData,
      deviceType: this.selectedDevice
    };
    this.isLoading = true;
    this.aepsService.finoMerchantEKYC(requestPayload).subscribe(response => {
      if (response.Status_Code === "1") {
        this.toastr.success(response.Message);
        this.isDailyRegistrationPopupVisible = false;
        this.isEKYCProceedForFino = false;
        this.fingurdataKYCforJPB = false;
        this.fingerprintSuccess = true;
        this.closeDailyRegistrationPopup();
      }
      else if (response.Status_Code === "2") {
        this.toastr.error(response.Message);
        this.router.navigate(['/login']);
      }
      else {
        this.toastr.error(response.Message);
        if (response?.Message?.toLowerCase()?.includes("hmac already exit,transaction aborted") || response?.Message?.toLowerCase()?.includes("pid conversion failed: invalid pid xml structure. missing required elements.") || response?.Message?.toLowerCase()?.includes("npci timeout, please try after sometime.(96)")) {
          this.fingerprintSuccess = false;
          this.originalFingerXml = "";
          this.capturedFingerData = "";
        }
      }
      this.isLoading = false;
    });

  }

  FinoLoginPopupShow() {
    this.fingerprintSuccess = false;
    this.isDailyRegistrationPopupVisible = false;
    this.isDailyLoginPopupVisible = true;
  }

  submitAeps() {
    this.isLoading = true;

    if (!this.fingerprintSuccess) {
      this.toastr.error("Please capture fingerprint first");
      this.isLoading = false;
      return;
    }

    if (!this.mobileAadhar || this.mobileAadhar.length !== 12) {
      this.toastr.error("Enter valid Aadhaar number");
      this.isLoading = false;
      return;
    }

    if (!this.mobileNumber || this.mobileNumber.toString().length !== 10) {
      this.toastr.error("Enter valid mobile number");
      this.isLoading = false;
      return;
    }

    if (!this.bankname) {
      this.toastr.error("Please select a bank");
      this.isLoading = false;
      return;
    }

    // Amount needed only for withdrawal / deposit
    if (['Cash Withdrawal', 'Cash Deposit'].includes(this.selectedService) && (!this.amount || this.amount <= 0)) {
      this.toastr.error("Enter valid amount");
      this.isLoading = false;
      return;
    }

    // Determine TXN TYPE
    let txntype = '';
    if (this.selectedService === 'Balance Enquiry') txntype = 'be';
    if (this.selectedService === 'Cash Withdrawal') txntype = 'cw';
    if (this.selectedService === 'Cash Deposit') txntype = 'cd';
    if (this.selectedService === 'Mini Statement') txntype = 'ms';
    if (this.selectedService === 'Aadhar Pay') txntype = 'ap';

    if (this.selectedAEPSProvider == 'FINO') {
      const payload: FinoAepsRequest = {
        SessionKey: this.sessionKey,
        APIKey: "FinoAEPS001",
        aadharno: this.mobileAadhar,
        mobileno: this.authServiceobj.getUserPhoneNo().toString(),
        customermobileno: this.mobileNumber,
        bankiinno: this.bankname,
        BankName: this.getBankName(this.bankname),
        amount: this.amount?.toString() ?? "0",
        latitude: this.authServiceobj.getUserLat() == "" || this.authServiceobj.getUserLat() == null ? this.latitude : this.authServiceobj.getUserLat(),
        longitude: this.authServiceobj.getUserLongtitude() == "" || this.authServiceobj.getUserLongtitude() == null ? this.longitude : this.authServiceobj.getUserLongtitude(),
        fingerdata: this.capturedFingerData,
        DeviceSrNo: this.deviceSerialNumber,
        deviceType: "2",
        txntype: txntype,
        comingFrom: "Web",
      };
      this.aepsService.finoLogin(payload).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res?.Status_Code != "1") {
            if (res?.Message?.toLowerCase()?.includes("uidai technical error")) {
              this.toastr.error("Finger mismatch, please try again");
              this.fingerprintSuccess = false;
              this.originalFingerXml = "";
              this.capturedFingerData = "";
              this.selectedDevice = '';
            } else {
              this.toastr.error(res?.Message || "Transaction Failed");
              if (res?.Message?.toLowerCase()?.includes("hmac already exit,transaction aborted") || res?.Message?.toLowerCase()?.includes("finger print data is missing") || res?.Message?.toLowerCase()?.includes("pid conversion failed: invalid pid xml structure. missing required elements.") || res?.Message?.toLowerCase()?.includes("npci timeout, please try after sometime.(96)") || res?.Message?.toLowerCase()?.includes("biometric mismatch. please try again with different finger.(u3)")) {
                this.fingerprintSuccess = false;
                this.originalFingerXml = "";
              }
            }
            return;
          }
          this.toastr.success(res.Message || "Transaction Success");

          if (txntype === 'ms') {
            const invoiceData = {
              RRN: res.Data[0].UTRNO,
              ApiTxnId: res.Data[0].ApiTxnId,
              TxnId: res.Data[0].TxnId,
              AvailableBalance: res.Data[0].AvailableBalance,
              BankName: this.getBankName(this.bankname),
              AdhaarNo: res.Data[0].AdhaarNo,
              Mobile: this.mobileNumber,
              Date: new Date(),
              Message: res.Message,
              miniStatement: res.Data[0].TransactionList.map((x: any) => ({
                transactionType: x.DebitCredit,
                transactionTime: x.Date,
                amount: x.Amount,
                transactionDetails: x.Type
              })),
              balance: res.Data[0].AvailableBalance
            };

            this.openInvoice(invoiceData);

          }
          else {
            this.openInvoice(res.Data[0]);
          }
        },
        error: () => {
          this.isLoading = false;
          this.toastr.error("API Error. Try again.");
        }
      });
    }

    else {
      if (this.selectedService === 'Balance Enquiry') {
        const payload = {
          agentLoginId: this.authServiceobj.getAgentLoginId().toString(),
          agentPin: this.authServiceobj.getAgentPinCode().toString(),
          aadhaarNumber: this.mobileAadhar.toString(),
          bankId: this.bankname.toString(),
          bankName: this.getBankName(this.bankname).toString(),
          latitude: parseFloat(Number(this.authServiceobj.getAgentLattitude()).toFixed(4)).toString(),
          longitude: parseFloat(Number(this.authServiceobj.getAgentLongtitude()).toFixed(4)).toString(),
          mobileNumber: this.mobileNumber.toString(),
          pidXml: this.originalFingerXml.toString(),
          accessToken: this.authServiceobj.getAgentAccessToken().toString(),
          appIdentifierToken: this.authServiceobj.getAgentAppIdentifierToken().toString(),
          comingFrom: "WEB",
          serviceId: 5,
          userId: this.authServiceobj.getUserId().toString(),
          AuthType: "FINGER"
        };

        this.aepsService.jpbBalanceEnquiry(payload).subscribe({
          next: (res) => {
            this.isLoading = false;

            if (!res?.success) {
              let resData: JIODailyTokenResponse = {
                aepsauthtoken: res.accessToken,
                appidentifiertoken: res.appIdentifierToken,
              };
              this.authServiceobj.SaveTokenForJPB(resData);
              if (res?.message?.toLowerCase()?.includes("uidai technical error") || res?.responseMessage?.toLowerCase()?.includes("uidai technical error")) {
                this.toastr.error("Finger mismatch, please try again");
                this.fingerprintSuccess = false;
                this.originalFingerXml = "";
                this.capturedFingerData = "";
                this.selectedDevice = '';
              } else {
                this.toastr.error(res?.message || "Transaction Failed");
                if (res?.message?.toLowerCase()?.includes("finger print data is missing") || res?.message?.toLowerCase()?.includes("u3-biometric authentication is failed. please try again") || res?.responseMessage?.toLowerCase()?.includes("u3-biometric authentication is failed. please try again")) {
                  this.fingerprintSuccess = false;
                  this.originalFingerXml = "";
                }
              }
              this.isLoading = false;
              return;
            }

            this.toastr.success(res.message || "Success");

            const invoiceData = {
              RRN: res.rrn,
              ApiTxnId: res.apiTxnId,
              TxnId: res.transactionId,
              AvailableBalance: res.balance,
              AccountExists: res.accountExists,
              TransId: res.transId,
              BankName: this.getBankName(this.bankname),
              AdhaarNo: this.mobileAadhar,
              Mobile: this.mobileNumber,
              Date: new Date(),
              Message: res.message
            };


            let resData: JIODailyTokenResponse = {
              aepsauthtoken: res.accessToken,
              appidentifiertoken: res.appIdentifierToken,
            };
            this.authServiceobj.SaveTokenForJPB(resData);
            this.isLoading = false;

            this.openInvoice(invoiceData);
          },
          error: () => {
            this.isLoading = false;
            this.toastr.error("API Error. Try again.");
          }
        });

        return;

      }

      if (this.selectedService === 'Cash Withdrawal') {

        const payload = {
          agentLoginId: this.authServiceobj.getAgentLoginId().toString(),
          agentPin: this.authServiceobj.getAgentPinCode().toString(),
          aadhaar: this.mobileAadhar.toString(),
          bankId: this.bankname.toString(),
          bankName: this.getBankName(this.bankname).toString(),
          mobile: this.mobileNumber.toString(),
          latitude: parseFloat(Number(this.authServiceobj.getAgentLattitude()).toFixed(4)).toString(),
          longitude: parseFloat(Number(this.authServiceobj.getAgentLongtitude()).toFixed(4)).toString(),
          fingerprintXml: this.originalFingerXml.toString(),
          accessToken: this.authServiceobj.getAgentAccessToken().toString(),
          appIdentifierToken: this.authServiceobj.getAgentAppIdentifierToken().toString(),
          comingFrom: "WEB",
          amount: this.amount,
          userId: this.authServiceobj.getUserId().toString(),
          AuthType: "FINGER"
        };

        this.aepsService.jpbCashWithdrawal(payload).subscribe({
          next: (res) => {
            this.isLoading = false;

            if (!res?.success) {
              let resData: JIODailyTokenResponse = {
                aepsauthtoken: res.accessToken,
                appidentifiertoken: res.appIdentifierToken,
              };
              this.authServiceobj.SaveTokenForJPB(resData);
              if (res?.message?.toLowerCase()?.includes("uidai technical error") || res?.responseMessage?.toLowerCase()?.includes("uidai technical error")) {
                this.toastr.error("Finger mismatch, please try again");
                this.fingerprintSuccess = false;
                this.originalFingerXml = "";
                this.capturedFingerData = "";
                this.selectedDevice = '';
              } else {
                this.toastr.error(res?.responseMessage || "Transaction Failed");
                if (res?.message?.toLowerCase()?.includes("finger print data is missing") || res?.message?.toLowerCase()?.includes("u3-biometric authentication is failed. please try again") || res?.responseMessage?.toLowerCase()?.includes("u3-biometric authentication is failed. please try again")) {
                  this.fingerprintSuccess = false;
                  this.originalFingerXml = "";
                }
              }
              return;
            }

            this.toastr.success(res.responseMessage);

            const data = res.responseData;

            const invoiceData = {
              RRN: data?.Transaction?.RRN || data?.Transaction?.rrn || data?.transaction?.rrn,
              ApiTxnId: data?.Transaction?.TransactionId || data?.Transaction?.transactionId || data?.transaction?.transactionId,
              TxnId: data?.Transaction?.Invoice || data?.Transaction?.TransactionId || data?.Transaction?.TransactionId || data?.Transaction?.transactionId || data?.transaction?.transactionId,
              AvailableBalance: data?.Account?.Balance || data?.Account?.balance || data?.account?.balance,
              AccountExists: "YES",
              amount: this.amount,
              BankName: this.getBankName(this.bankname),
              AdhaarNo: this.mobileAadhar,
              Mobile: this.mobileNumber,
              Date: new Date(),
              Message: res?.responseMessage,
              traceId: res?.traceid
            };

            this.openInvoice(invoiceData);

            let resData: JIODailyTokenResponse = {
              aepsauthtoken: res.accessToken,
              appidentifiertoken: res.appIdentifierToken,
            };
            this.authServiceobj.SaveTokenForJPB(resData);
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
            this.toastr.error("API Error");
          }
        });

        return;

      }

      if (this.selectedService === 'Cash Deposit') {
        const payload = {
          agentLoginId: this.authServiceobj.getAgentLoginId().toString(),
          agentPin: this.authServiceobj.getAgentPinCode().toString(),
          aadhaar: this.mobileAadhar.toString(),
          bankId: this.bankname.toString(),
          bankName: this.getBankName(this.bankname).toString(),
          mobile: this.mobileNumber.toString(),
          latitude: parseFloat(Number(this.authServiceobj.getAgentLattitude()).toFixed(4)).toString(),
          longitude: parseFloat(Number(this.authServiceobj.getAgentLongtitude()).toFixed(4)).toString(),
          fingerprintXml: this.originalFingerXml.toString(),
          accessToken: this.authServiceobj.getAgentAccessToken().toString(),
          appIdentifierToken: this.authServiceobj.getAgentAppIdentifierToken().toString(),
          comingFrom: "WEB",
          amount: this.amount,
          userId: this.authServiceobj.getUserId().toString(),
          AuthType: "FINGER"
        };

        this.aepsService.jpbCashDeposit(payload).subscribe({
          next: (res) => {
            this.isLoading = false;

            if (!res?.success) {
              let resData: JIODailyTokenResponse = {
                aepsauthtoken: res.accessToken,
                appidentifiertoken: res.appIdentifierToken,
              };
              this.authServiceobj.SaveTokenForJPB(resData);
              if (res?.message?.toLowerCase()?.includes("uidai technical error") || res?.responseMessage?.toLowerCase()?.includes("uidai technical error")) {
                this.toastr.error("Finger mismatch, please try again");
                this.fingerprintSuccess = false;
                this.originalFingerXml = "";
                this.capturedFingerData = "";
                this.selectedDevice = '';
              } else {
                this.toastr.error(res?.responseMessage || "Transaction Failed");
                if (res?.message?.toLowerCase()?.includes("finger print data is missing") || res?.message?.toLowerCase()?.includes("u3-biometric authentication is failed. please try again") || res?.responseMessage?.toLowerCase()?.includes("u3-biometric authentication is failed. please try again")) {
                  this.fingerprintSuccess = false;
                  this.originalFingerXml = "";
                }
              }
              return;
            }

            this.toastr.success(res.responseMessage);

            const data = res.responseData;

            const invoiceData = {
              RRN: data?.Transaction?.RRN || data?.Transaction?.rrn || data?.transaction?.rrn,
              ApiTxnId: data?.Transaction?.TransactionId || data?.Transaction?.transactionId || data?.transaction?.transactionId,
              TxnId: data?.Transaction?.Invoice || data?.Transaction?.TransactionId || data?.Transaction?.TransactionId || data?.Transaction?.transactionId || data?.transaction?.transactionId,
              AvailableBalance: data?.Account?.Balance || data?.Account?.balance || data?.account?.balance,
              AccountExists: "YES",
              amount: this.amount,
              BankName: this.getBankName(this.bankname),
              AdhaarNo: this.mobileAadhar,
              Mobile: this.mobileNumber,
              Date: new Date(),
              Message: res?.responseMessage,
              traceId: res?.traceid
            };

            this.openInvoice(invoiceData);

            let resData: JIODailyTokenResponse = {
              aepsauthtoken: res.accessToken,
              appidentifiertoken: res.appIdentifierToken,
            };
            this.authServiceobj.SaveTokenForJPB(resData);
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
            this.toastr.error("API Error");
          }
        });

        return;

      }

      if (this.selectedService === 'Mini Statement') {

        const payload = {
          agentLoginId: this.authServiceobj.getAgentLoginId().toString(),
          agentPin: this.authServiceobj.getAgentPinCode().toString(),
          aadhaar: this.mobileAadhar.toString(),
          bankId: this.bankname.toString(),
          bankName: this.getBankName(this.bankname).toString(),
          mobile: this.mobileNumber.toString(),
          fingerprintXml: this.originalFingerXml.toString(),
          latitude: parseFloat(Number(this.authServiceobj.getAgentLattitude()).toFixed(4)).toString(),
          longitude: parseFloat(Number(this.authServiceobj.getAgentLongtitude()).toFixed(4)).toString(),
          accessToken: this.authServiceobj.getAgentAccessToken().toString(),
          appIdentifierToken: this.authServiceobj.getAgentAppIdentifierToken().toString(),
          comingFrom: "WEB",
          userId: this.authServiceobj.getUserId().toString(),
          AuthType: "FINGER"
        };

        this.aepsService.jpbMiniStatement(payload).subscribe({
          next: (res) => {
            this.isLoading = false;

            if (!res?.success) {
              let resData: JIODailyTokenResponse = {
                aepsauthtoken: res.accessToken,
                appidentifiertoken: res.appIdentifierToken,
              };
              this.authServiceobj.SaveTokenForJPB(resData);
              if (res?.message?.toLowerCase()?.includes("uidai technical error") || res?.responseMessage?.toLowerCase()?.includes("uidai technical error")) {
                this.toastr.error("Finger mismatch, please try again");
                this.fingerprintSuccess = false;
                this.originalFingerXml = "";
                this.capturedFingerData = "";
                this.selectedDevice = '';
              } else {
                this.toastr.error(res?.responseMessage || res?.message || "Transaction Failed");
                if (res?.message?.toLowerCase()?.includes("finger print data is missing") || res?.message?.toLowerCase()?.includes("invalid application access token format") || res?.message?.toLowerCase()?.includes("u3-biometric authentication is failed. please try again") || res?.responseMessage?.toLowerCase()?.includes("u3-biometric authentication is failed. please try again")) {
                  this.fingerprintSuccess = false;
                  this.originalFingerXml = "";
                }
              }
              return;
            }

            const parsed = res.parsedResponse;

            const txn = parsed?.responseData?.transaction;
            const account = parsed?.responseData?.account;
            const mini = parsed?.responseData?.miniStatement || [];
            const mini10 = mini.slice(0, 10);

            const invoiceData = {
              txntype: 'ms',
              AdhaarNo: this.mobileAadhar,
              BankName: this.getBankName(this.bankname),
              AvailableBalance: account?.balance,
              rrn: txn?.rrn,
              datetime: txn?.transactionTime,
              miniStatement: mini10,
              totalAmount: account?.balance,
              traceId: parsed?.traceId
            };


            this.openInvoice(invoiceData);

            let resData: JIODailyTokenResponse = {
              aepsauthtoken: res.accessToken,
              appidentifiertoken: res.appIdentifierToken,
            };
            this.authServiceobj.SaveTokenForJPB(resData);
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;  //
            this.toastr.error("API Error");
          }
        });

        return;

      }
    }


  }

  openInvoice(apiData: any) {
    let txntype = '';
    if (this.selectedService === 'Balance Enquiry') txntype = 'be';
    if (this.selectedService === 'Cash Withdrawal') txntype = 'cw';
    if (this.selectedService === 'Cash Deposit') txntype = 'cd';
    if (this.selectedService === 'Mini Statement') txntype = 'ms';
    if (this.selectedService === 'Aadhar Pay') txntype = 'ap';
    this.invoiceData = {
      txntype: txntype,
      aadharno: apiData?.AdhaarNo,
      BankName: apiData?.BankName,
      amount: this.amount?.toString(),
      balance: apiData?.AvailableBalance,
      rrn: apiData?.UTRNO || apiData?.RRN,
      datetime: apiData?.TxnDate || new Date().toLocaleString(),
      miniStatement: apiData?.miniStatement
    };

    this.modalService.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  showMiniStatement(data: any[]) {
    this.miniStatementList = data;
    this.showRecentTxns = true;
  }

  checkDailyLoginJPB() {
    this.isLoading = true;
    this.aepsService.checkDailyLoginJPB().subscribe((res) => {
      console.log("Daily Login Response:", res);
      this.authServiceobj.saveJPBAEPSToken(res);
      switch (res.statusCode) {
        case "00":
          this.authServiceobj.saveJPBAEPSToken(res);
          break;

        case "11":
          this.openJPBAgentLoginPopup();
          break;

        case "33":
          this.toastr.error(res.message);
          break;

        default:
          this.toastr.error("Unknown response: " + res.message);
      }
      this.isLoading = false;
    });
  }

  openJPBAgentLoginPopup() {
    this.showAgentRegistrationModalJPB = false;
    this.showAgentLoginModalJPB = true;   // Your popup flag
  }

  submitAgentLoginJPB() {

    if (this.JPBdailyLoginForm.invalid) {
      this.showFormErrors(this.JPBdailyLoginForm);
      return;
    }
    this.isLoading = true;
    const f = this.JPBdailyLoginForm.value;
    const agentId = f.agentrefno;
    const mob = f.mobileno;
    const aadhar = f.aadharno;

    this.aepsService.agentStatus(agentId, mob, aadhar).subscribe((res) => {
      console.log("Agent Status:", res);

      switch (res.statusCode) {
        case "00":
          this.authServiceobj.saveJPBAEPSToken(res);
          this.showAgentLoginModalJPB = false;
          this.initDailyLoginFormForJPB();
          break;

        case "22":
          this.toastr.error("Agent not found");
          this.openJPBRegistrationPopup();
          break;

        default:
          this.toastr.error(res.message);
      }
      this.isLoading = false;
    });
  }


  openJPBRegistrationPopup() {
    this.showAgentRegistrationModalJPB = true;
  }



  closeJPBRegistrationPopup() {
    this.showAgentRegistrationModalJPB = false;
    this.fingerprintSuccess = false;
  }


  submitAgentKYCJPB() {
    const req = this.JPBAgentEKYCForm.value;
    if (req.aadharNumber.trim() == "") {
      this.toastr.error('Please Enter Aadhar Number');
      return;
    }
    this.isLoading = true;
    const ekycReq = {
      applicationNumber: this.applicationNumber.toString(),
      aadhaarValue: req.aadharNumber.toString(),
      pidXml: this.originalFingerXml.toString(),
      accessToken: this.accessToken ?? this.authServiceobj.getAgentAccessToken(),
      appIdentifierToken: this.appIdentifierToken ?? this.authServiceobj.getAgentAppIdentifierToken(),
      mobile: this.JPBAgentRegistrationForm.get('mobile')?.value.toString(),
      AuthType: "FINGER"
    };
    this.aepsService.agentEKYC(ekycReq).subscribe({
      next: (res) => {
        if (res.success && res.status != "FAILED") {
          this.toastr.success("EKYC Completed Successfully, Once Team will approve you will able to use!");
          this.closeJPBRegistrationPopup();
          this.initAgentEKYCFormJPB();
          this.initAgentRegistrationFormForJPB();
        } else {
          this.toastr.error("EKYC Failed: " + res.errorMessage);
        }

        let resData: JIODailyTokenResponse = {
          aepsauthtoken: res.accessToken,
          appidentifiertoken: res.appIdentifierToken,
        };
        this.authServiceobj.SaveTokenForJPB(resData);
        this.isLoading = false;
      },
      error: (err) => console.error(err)
    });

  }

  createJPBAgent() {

    const req = this.JPBAgentRegistrationForm.value;
    req.accessToken = this.authServiceobj.getAgentAccessToken();
    req.appIdentifierToken = this.authServiceobj.getAgentAppIdentifierToken();
    req.refNo = req.refNo.toString();
    req.mobile = req.mobile.toString();
    req.pincode = req.pincode.toString();

    if (this.JPBAgentRegistrationForm.invalid) {
      this.showFormErrors(this.JPBAgentRegistrationForm);
      return;
    }

    this.isLoading = true;

    this.aepsService.createAgent(req).subscribe({
      next: (res) => {
        const isDuplicate =
          res.message &&
          res.message.toLowerCase().includes("duplicate match found");
        if (res.success) {
          this.toastr.success("Agent Created Successfully, Please Complete E-KYC");
          this.authServiceobj.saveAgentCookies(res.applicationNumber, res.agentRefNo);
          this.applicationNumber = res.applicationNumber;
          this.accessToken = res.accessToken;
          this.appIdentifierToken = res.appIdentifierToken;
          this.fingurdataKYCforJPB = true;
        }
        else if (isDuplicate) {
          const extracted = this.extractDuplicateInfo(res.message);

          if (extracted?.applicationNumber && extracted?.agentId) {
            // overwrite missing fields
            res.applicationNumber = extracted.applicationNumber;
            res.agentRefNo = extracted.agentId;
          }
          this.toastr.info("Existing Agent Found — Proceeding to E-KYC");
          this.handleSuccess(res);
        }
        else {
          this.toastr.error(res.message);
        }

        let resData: JIODailyTokenResponse = {
          aepsauthtoken: res.accessToken,
          appidentifiertoken: res.appIdentifierToken,
        };
        this.authServiceobj.SaveTokenForJPB(resData);
        this.isLoading = false;
      },
      error: (err) => console.error(err)
    });
  }

  extractDuplicateInfo(message: string) {
    const appRegex = /ApplicationNumber\s*=\s*([^,\]]+)/i;
    const agentRegex = /Agent ID\s*=\s*([^,\]]+)/i;
    const applicationNumber = message.match(appRegex)?.[1]?.trim() || "";
    const agentId = message.match(agentRegex)?.[1]?.trim() || "";
    return { applicationNumber, agentId };
  }

  handleSuccess(res: any) {
    this.authServiceobj.saveAgentCookies(res.applicationNumber, res.agentRefNo);
    this.applicationNumber = res.applicationNumber;
    this.accessToken = res.accessToken;
    this.appIdentifierToken = res.appIdentifierToken;
    this.fingurdataKYCforJPB = true;
  }




  CancelTransection() {
    this.isLoading = true;
    this.banks = [];
    this.bankname = "";
    if (this.selectedAEPSProvider === 'FINO') {
      this.loadBanks();
      this.mobileNumber = this.authServiceobj.getUserPhoneNo();
    }

    if (this.selectedAEPSProvider === 'JPB') {
      this.loadBanksForJPB();
      this.mobileNumber = "";
    }
    this.selectedBank = "Select";
    this.mobileAadhar = "";
    this.amount = "";
    this.originalFingerXml = "";
    this.fingerprintSuccess = false;
    this.modalService.dismissAll();
    this.isLoading = false;

  }


  getStates() {
    this.aepsService.StateList().subscribe(res => {
      this.stateList = Object.entries(res).map(([code, name]) => ({ code, name }));
    });
  }


  SwitchCashWithdrawal() {
    //this.downloadInvoice();
    this.modalService.dismissAll();
    this.fingerprintSuccess = false;
    this.originalFingerXml = "";
    this.selectedService = 'Cash Withdrawal';
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
