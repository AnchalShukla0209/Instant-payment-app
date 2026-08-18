import { Component, OnInit, ViewChild, TemplateRef, inject } from '@angular/core';
import { GetUsersWithMainBalanceQuery } from '../../models/ClientData';
import { ClientReportService } from '../../services/Client-report.service';
import { HttpClient } from '@angular/common/http';
import { LoaderComponent } from '../app-loader/loader.component';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbTypeaheadModule, NgbToastModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import html2pdf from 'html2pdf.js';
import { EncryptionService } from '../../encryption/encryption.service';
import { environment } from '../../../environments/environment';
import {
  ClientUserVerificationService,
  ClientUserVerificationType,
  CommissionPlanOption
} from '../../services/client-user-verification.service';
import { PartnerShellComponent } from '../Partner-Shell/partner-shell.component';

@Component({
  selector: 'app-master-distributor-report',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, LoaderComponent, CommonModule, NgbTypeaheadModule, NgbToastModule, PartnerShellComponent],
  templateUrl: './MasterDistributorReport.component.html',
  styleUrls: ['./MasterDistributorReport.component.scss']
})

export class MasterDistributorReportComponent implements OnInit {

  /** Scope: only users created under the currently logged-in Master Distributor (MdId). */
  readonly scopeType = 'MD';
  private authServiceobj = inject(AuthService);
  private router = inject(Router);

  get MainclientId(): number {
    return Number(this.authServiceobj.getUserId()) || 0;
  }

  goBackToDashboard(): void {
    this.router.navigate(['/master-distributor/dashboard']);
  }

  walletTxn = {
    status: 'Credit',
    txnPin: '',
    amount: null,
    userId: 0,
    actionById: 0,
    userName: '',
    PhoneNo: '',
    txnRemarks: ''
  };

  modalRef!: NgbModalRef;
  private readonly apiUrl = environment.apiBaseUrl;
  readonly baseUrl = environment.apiBaseUrl.replace(/\/api\/?$/, '/');
  clientForm: FormGroup;
  filePreviews: any = {}; // holds path strings
  isEditMode: boolean = false;
  clientId: number = 0;
  Username: string = '';
  Oldbalance: string = '';
  NewBalance: string = '';
  Amount: string = '';
  TxnType: string = '';
  CrdrType: string = '';
  Remarks: string = '';
  Txndate: Date = new Date();
  ErrorMessage: string = '';
  IsSuccessful: string = '';
  ErrorMessages: string = '';
  selectedRowIndex: number | null = null;
  model: any = {

    CompanyName: '',
    UserName: '',
    EmailId: '',
    Phone: '',
    Password: '',
    PanCard: '',
    AadharCard: '',
    MPin: '',
    CustomerName: '',
    FatherName: '',
    UserType: '',

    ShopAddress: '',
    ShopState: '',
    ShopCity: '',
    ShopZipCode: '',

    MDName: '',
    ADName: '',
    ADMINName: '',


    Logo: '',
    AddressLine1: '',
    AddressLine2: '',
    State: '',
    City: '',
    Pincode: '',
    Pancopy: '',
    AadharFront: '',
    AadharBack: '',
    Recharge: 'Active',
    MoneyTransfer: 'Active',
    AEPS: 'Active',
    BillPayment: 'Active',
    MicroATM: 'Active',
    RazorpayPayment: 'Active',
    Settlement: 'Active',
    Status: 'Active',
    RegDate: new Date().toISOString().substring(0, 16),
    TxnPin: '',
    PlanId: '',
    PlanName: '',
    Latitude: '',
    Longitude: ''
  };

  files: any = {
    Logo: null,
    Pancopy: null,
    AadharFront: null,
    AadharBack: null,
    Selfie: null
  };

  uploadedFiles: { [key: string]: File } = {};

  activeTab = 'companyInfo';

  tabList = [
    { id: 'companyInfo', label: 'COMPANY INFO' },
    { id: 'addressInfo', label: 'ADDRESS INFO' },
    { id: 'shopInfo', label: 'SHOP INFO' },
    { id: 'serviceRights', label: 'SERVICE RIGHTS INFO' },
    { id: 'uploadDocs', label: 'DOCUMENT' }
  ];

  filePreview(file: File): string {
    return URL.createObjectURL(file);
  }
  closeModal() {
    // Implement modal close logic if needed
  }

  submitForm() {
    console.log('Form Data:', this.model);
    console.log('Files:', this.files);
  }



  users: any[] = [];
  paginatedUsers: any[] = [];

  searchKeyword: string = '';
  fromDate: string = '';
  toDate: string = '';
  isLoading: boolean = false;
  TotalBalance: Number = 0;
  ShowTotalBalance: boolean = false;
  lat: string = '';
  lng: string = '';
  commissionPlans: CommissionPlanOption[] = [];
  phoneOtp = '';
  emailOtp = '';
  phoneChallengeId = '';
  emailChallengeId = '';
  phoneChallengeValue = '';
  emailChallengeValue = '';
  mobileVerificationToken = '';
  emailVerificationToken = '';
  panVerificationToken = '';
  panVerifiedName = '';
  aadhaarVerificationToken = '';
  aadhaarVerifiedInfo = '';
  verifiedValues = { phone: '', email: '', pan: '', aadhaar: '' };
  persistedVerification = { phone: false, email: false, pan: false, aadhaar: false };
  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  visiblePages: (number | null)[] = [];
  name: string = '';
  private identityAvailabilityRequestId = 0;

  @ViewChild('clientModel', { static: true }) clientModal!: TemplateRef<any>;
  @ViewChild('ViewclientDetailsModel', { static: true }) ViewclientDetailsModel!: TemplateRef<any>;
  @ViewChild('PayClientModel', { static: true }) PayClientmodal !: TemplateRef<any>;
  @ViewChild('invoiceModal', { static: true }) invoiceModal !: TemplateRef<any>;
  constructor(private fb: FormBuilder, private http: HttpClient, private toastr: ToastrService, private _clientservice: ClientReportService, private modalService: NgbModal, private encryptor: EncryptionService, private verificationService: ClientUserVerificationService) {

    this.clientForm = this.fb.group({
      companyInfo: this.fb.group({
        UserType: ['RT', Validators.required],
        CompanyName: ['', Validators.required],
        CustomerName: ['', Validators.required],
        FatherName: ['', Validators.required],
        UserName: ['', Validators.required],
        EmailId: ['', [Validators.required, Validators.email]],
        Phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        PanCard: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
        AadharCard: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
        CommissionPlanId: [null, Validators.required],
      }),
      addressInfo: this.fb.group({
        AddressLine1: ['', Validators.required],
        AddressLine2: ['', Validators.required],
        State: ['', Validators.required],
        City: ['', Validators.required],
        Pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
      }),
      shopInfo: this.fb.group({
        ShopAddress: ['', Validators.required],
        ShopState: ['', Validators.required],
        ShopCity: ['', Validators.required],
        ShopZipCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        Latitude: ['', [Validators.required, Validators.pattern(/^-?\d{1,3}(?:\.\d{1,5})?$/), Validators.min(-90), Validators.max(90)]],
        Longitude: ['', [Validators.required, Validators.pattern(/^-?\d{1,3}(?:\.\d{1,5})?$/), Validators.min(-180), Validators.max(180)]]
      }),
      serviceRights: this.fb.group({
        Recharge: ['Active', Validators.required],
        MoneyTransfer: ['Active', Validators.required],
        AEPS: ['Active', Validators.required],
        BillPayment: ['Active', Validators.required],
        MicroATM: ['Active', Validators.required],
        RazorpayPayment: ['Active', Validators.required],
        Settlement: ['Active', Validators.required],
        Status: ['Active', Validators.required],
      }),
      uploadDocs: this.fb.group({
        PancopyFile: [null, Validators.required],
        AadharFrontFile: [null, Validators.required],
        AadharBackFile: [null, Validators.required],
        LogoFile: [null, Validators.required],
        SelfieFile: [null, Validators.required]
      }),

    });
  }

  onFileChange(event: any, fileType: string) {
    this.isLoading = true;
    const file = event.target.files[0];
    if (file) {
      this.uploadedFiles[fileType] = file;
      this.filePreviews[fileType] = URL.createObjectURL(file);
      const uploadGroup = this.clientForm.get('uploadDocs') as FormGroup;
      const control = uploadGroup.get(fileType);

      if (control) {
        control.removeValidators(Validators.required);
        control.updateValueAndValidity();
      }
      this.isLoading = false;

    }
    this.isLoading = false;
  }

  deleteFile(controlName: string, FileId: Number): void {
    this.isLoading = true;
    if (!confirm(`Are you sure you want to delete ${controlName}?`)) {
      this.isLoading = false;
      return;
    }
    delete this.uploadedFiles[controlName];
    if (this.filePreviews[controlName]) {
      URL.revokeObjectURL(this.filePreviews[controlName]);
      delete this.filePreviews[controlName];
    }
    const fileControl = this.uploadDocsForm.get(`${controlName}`);
    fileControl?.setValidators(Validators.required);
    fileControl?.updateValueAndValidity();
    this.model[`${controlName}`] = null;
    this.clientForm.get('uploadDocs')?.get(controlName)?.setValue(null);

    this.http.delete(`${this.apiUrl}/v1/partner/users/delete-file?clientId=${FileId}&fileType=${controlName}`)
      .subscribe({
        next: (res) => {
          if (controlName === 'LogoFile') this.model.LogoFile = null;
          if (controlName === 'PancopyFile') this.model.PancopyFile = null;
          if (controlName === 'AadharFrontFile') this.model.AadharFrontFile = null;
          if (controlName === 'AadharBackFile') this.model.AadharBackFile = null;
          this.toastr.success(`${controlName} deleted successfully`);
          this.isLoading = false;
        },
        error: (err) => {
          console.error(`Error deleting ${controlName}:`, err);
          this.toastr.error(`Failed to delete ${controlName}`);
          this.isLoading = false;
        }
      });
  }

  selectRow(index: number): void {
    this.selectedRowIndex = index;
  }

  get uploadDocsForm() {
    return this.clientForm.get('uploadDocs') as FormGroup;
  }

  ngOnInit() {

    this.loadCommissionPlans();
    this.loadClients(this.currentPage, this.pageSize);
  }

  loadClients(pageIndex: number, pageSize: number): void {
    this.isLoading = true;
    const payload: GetUsersWithMainBalanceQuery = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      pageIndex,
      pageSize,
      ClientId: this.MainclientId,
      ScopeType: this.scopeType,
      commonsearch: this.searchKeyword
    };

    this._clientservice.getPartnerUserReport(payload).subscribe({
      next: (res: any) => {
        
        // The partner-scoped report endpoint returns plain (unencrypted) JSON serialized
        // with camelCase property names, unlike the AES-encrypted WL Admin report.
        this.users = res.users || [];
        this.totalRecords = res.totalRecords || 0;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = pageIndex;
        this.updateVisiblePages();
        this.TotalBalance = res.totalBalance || 0
        this.isLoading = false;
        this.applyFilter();
      },
      error: () => (this.isLoading = false),
    });
  }

  loadCommissionPlans(): void {
    this.verificationService.getPartnerCommissionPlans().subscribe({
      next: response => {
        this.commissionPlans = response.success ? response.data : [];
      },
      error: () => this.toastr.error('Unable to load commission plans.')
    });
  }

  clearDuplicate(field: 'UserName' | 'Phone' | 'EmailId' | 'PanCard' | 'AadharCard'): void {
    this.identityAvailabilityRequestId++;
    const control = this.clientForm.get(`companyInfo.${field}`);
    if (!control?.hasError('duplicate')) return;
    const errors = { ...(control.errors || {}) };
    delete errors['duplicate'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  checkIdentityAvailability(): void {
    const group = this.clientForm.get('companyInfo') as FormGroup;
    const requestId = ++this.identityAvailabilityRequestId;
    this.verificationService.checkPartnerIdentityAvailability({
      userId: this.clientId,
      username: String(group.get('UserName')?.value || '').trim(),
      phone: String(group.get('Phone')?.value || '').trim(),
      emailId: String(group.get('EmailId')?.value || '').trim(),
      panCard: String(group.get('PanCard')?.value || '').trim(),
      aadharCard: String(group.get('AadharCard')?.value || '').trim()
    }).subscribe({
      next: response => {
        if (requestId !== this.identityAvailabilityRequestId || !response.success) return;
        this.setDuplicateError('UserName', !response.data.usernameAvailable);
        this.setDuplicateError('Phone', !response.data.phoneAvailable);
        this.setDuplicateError('EmailId', !response.data.emailAvailable);
        this.setDuplicateError('PanCard', !response.data.panAvailable);
        this.setDuplicateError('AadharCard', !response.data.aadhaarAvailable);
      }
    });
  }

  private setDuplicateError(field: 'UserName' | 'Phone' | 'EmailId' | 'PanCard' | 'AadharCard', duplicate: boolean): void {
    const control = this.clientForm.get(`companyInfo.${field}`);
    if (!control) return;
    const errors = { ...(control.errors || {}) };
    if (duplicate) errors['duplicate'] = true;
    else delete errors['duplicate'];
    control.setErrors(Object.keys(errors).length ? errors : null);
  }

  sendVerificationOtp(type: ClientUserVerificationType): void {
    const controlName = type === 'phone' ? 'Phone' : 'EmailId';
    const control = this.clientForm.get(`companyInfo.${controlName}`);
    if (!control || control.invalid) {
      control?.markAsTouched();
      this.toastr.error(`Enter a valid ${type === 'phone' ? 'mobile number' : 'email address'}.`);
      return;
    }

    this.isLoading = true;
    this.verificationService.sendOtp(type, control.value, this.verificationService.partnerUserBase).subscribe({
      next: response => {
        this.isLoading = false;
        if (!response.success || !response.challengeId) {
          this.toastr.error(response.message);
          return;
        }
        if (type === 'phone') {
          this.phoneChallengeId = response.challengeId;
          this.phoneChallengeValue = String(control.value).trim();
          this.phoneOtp = '';
        } else {
          this.emailChallengeId = response.challengeId;
          this.emailChallengeValue = String(control.value).trim().toLowerCase();
          this.emailOtp = '';
        }
        this.toastr.success(response.message);
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error(`Unable to send ${type} OTP.`);
      }
    });
  }

  verifyOtp(type: ClientUserVerificationType): void {
    const challengeId = type === 'phone' ? this.phoneChallengeId : this.emailChallengeId;
    const otp = type === 'phone' ? this.phoneOtp : this.emailOtp;
    if (!challengeId || !/^\d{6}$/.test(otp)) {
      this.toastr.error('Enter the 6-digit OTP.');
      return;
    }
    const currentValue = String(this.clientForm.get(
      type === 'phone' ? 'companyInfo.Phone' : 'companyInfo.EmailId'
    )?.value || '').trim();
    const challengeValue = type === 'phone' ? this.phoneChallengeValue : this.emailChallengeValue;
    if ((type === 'email' ? currentValue.toLowerCase() : currentValue) !== challengeValue) {
      this.toastr.error(`The ${type} value changed. Please request a new OTP.`);
      return;
    }

    this.isLoading = true;
    this.verificationService.verifyOtp(type, challengeId, otp, this.clientId, this.verificationService.partnerUserBase).subscribe({
      next: response => {
        this.isLoading = false;
        if (!response.success || !response.verificationToken) {
          this.toastr.error(response.message);
          return;
        }
        const value = this.clientForm.get(
          type === 'phone' ? 'companyInfo.Phone' : 'companyInfo.EmailId'
        )?.value;
        if (type === 'phone') {
          this.mobileVerificationToken = response.verificationToken;
          this.verifiedValues.phone = value;
          this.persistedVerification.phone = true;
          this.phoneChallengeId = '';
          this.phoneChallengeValue = '';
        } else {
          this.emailVerificationToken = response.verificationToken;
          this.verifiedValues.email = String(value).toLowerCase();
          this.persistedVerification.email = true;
          this.emailChallengeId = '';
          this.emailChallengeValue = '';
        }
        this.toastr.success(response.message);
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('OTP verification failed.');
      }
    });
  }

  verifyPan(): void {
    const control = this.clientForm.get('companyInfo.PanCard');
    if (!control || control.invalid) {
      control?.markAsTouched();
      this.toastr.error('Enter a valid PAN number.');
      return;
    }

    const panNumber = String(control.value).toUpperCase();
    control.setValue(panNumber, { emitEvent: false });
    this.isLoading = true;
    this.verificationService.verifyPan(panNumber, this.clientId, this.verificationService.partnerUserBase).subscribe({
      next: response => {
        this.isLoading = false;
        if (!response.success || !response.verificationToken) {
          this.toastr.error(response.message);
          return;
        }
        this.panVerificationToken = response.verificationToken;
        this.panVerifiedName = response.verifiedName || '';
        this.verifiedValues.pan = panNumber;
        this.persistedVerification.pan = true;
        this.toastr.success(response.message);
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('PAN verification failed.');
      }
    });
  }

  verifyAadhaar(): void {
    const control = this.clientForm.get('companyInfo.AadharCard');
    if (!control || control.invalid) {
      control?.markAsTouched();
      this.toastr.error('Enter a valid 12-digit Aadhar number.');
      return;
    }

    const aadharNumber = String(control.value).trim();
    this.isLoading = true;
    this.verificationService.verifyAadhaar(aadharNumber, this.clientId, this.verificationService.partnerUserBase).subscribe({
      next: response => {
        this.isLoading = false;
        if (!response.success || !response.verificationToken) {
          this.toastr.error(response.message);
          return;
        }
        this.aadhaarVerificationToken = response.verificationToken;
        this.aadhaarVerifiedInfo = response.verifiedName || '';
        this.verifiedValues.aadhaar = aadharNumber;
        this.persistedVerification.aadhaar = true;
        this.toastr.success(response.message);
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Aadhaar verification failed.');
      }
    });
  }

  isVerified(type: 'phone' | 'email' | 'pan' | 'aadhaar'): boolean {
    const path = type === 'phone'
      ? 'companyInfo.Phone'
      : type === 'email'
        ? 'companyInfo.EmailId'
        : type === 'pan'
          ? 'companyInfo.PanCard'
          : 'companyInfo.AadharCard';
    let currentValue = String(this.clientForm.get(path)?.value || '').trim();
    if (type === 'email') currentValue = currentValue.toLowerCase();
    if (type === 'pan') currentValue = currentValue.toUpperCase();
    return this.persistedVerification[type] && this.verifiedValues[type] === currentValue;
  }

  private resetVerificationState(): void {
    this.phoneOtp = '';
    this.emailOtp = '';
    this.phoneChallengeId = '';
    this.emailChallengeId = '';
    this.phoneChallengeValue = '';
    this.emailChallengeValue = '';
    this.mobileVerificationToken = '';
    this.emailVerificationToken = '';
    this.panVerificationToken = '';
    this.panVerifiedName = '';
    this.aadhaarVerificationToken = '';
    this.aadhaarVerifiedInfo = '';
    this.verifiedValues = { phone: '', email: '', pan: '', aadhaar: '' };
    this.persistedVerification = { phone: false, email: false, pan: false, aadhaar: false };
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
    
    this.paginatedUsers = this.users;
    this.isLoading = false;
  }

  resetFilter(): void {
    this.fromDate = '';
    this.toDate = '';
    this.searchKeyword = '';
    this.loadClients(1, this.pageSize);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadClients(page, this.pageSize);
  }

  getTotalBalance(): void {
    this.isLoading = true;
    this.toastr.success('Total balance is: ' + this.TotalBalance, 'success');
    this.ShowTotalBalance = true;
    this.isLoading = false;
  }

  openAddClientForm() {
    this.isLoading = true;
    this.activeTab = 'companyInfo';
    this.model = {
      CompanyName: '',
      UserName: '',
      EmailId: '',
      Phone: '',
      Password: '',
      PanCard: '',
      AadharCard: '',
      MPin: '',
      FatherName: '',
      DomainName: '',
      Logo: '',
      AddressLine1: '',
      AddressLine2: '',
      State: '',
      City: '',
      Pincode: '',
      Pancopy: '',
      AadharFront: '',
      AadharBack: '',
      Recharge: 'Active',
      MoneyTransfer: 'Active',
      AEPS: 'Active',
      BillPayment: 'Active',
      MicroATM: 'Active',
      RazorpayPayment: 'Active',
      Settlement: 'Active',
      APITransfer: 'Active',
      Margin: 'Active',
      Debit: 'Active',
      Status: 'Active',
      RegDate: new Date().toISOString().substring(0, 16),
      TxnPin: '',
      PlanId: ''
    };
    this.resetVerificationState();

    this.files = {
      Logo: null,
      Pancopy: null,
      AadharFront: null,
      AadharBack: null,
      Selfie: null
    };

    this.clientForm = this.fb.group({
      companyInfo: this.fb.group({
        UserType: ['RT', Validators.required],
        CompanyName: ['', Validators.required],
        CustomerName: ['', Validators.required],
        FatherName: ['', Validators.required],
        UserName: ['', Validators.required],
        EmailId: ['', [Validators.required, Validators.email]],
        Phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        PanCard: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
        AadharCard: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
        CommissionPlanId: [null, Validators.required],
      }),
      addressInfo: this.fb.group({
        AddressLine1: ['', Validators.required],
        AddressLine2: ['', Validators.required],
        State: ['', Validators.required],
        City: ['', Validators.required],
        Pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
      }),
      shopInfo: this.fb.group({
        ShopAddress: ['', Validators.required],
        ShopState: ['', Validators.required],
        ShopCity: ['', Validators.required],
        ShopZipCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
        Latitude: ['', [Validators.required, Validators.pattern(/^-?\d{1,3}(?:\.\d{1,5})?$/), Validators.min(-90), Validators.max(90)]],
        Longitude: ['', [Validators.required, Validators.pattern(/^-?\d{1,3}(?:\.\d{1,5})?$/), Validators.min(-180), Validators.max(180)]]
      }),
      serviceRights: this.fb.group({
        Recharge: ['Active', Validators.required],
        MoneyTransfer: ['Active', Validators.required],
        AEPS: ['Active', Validators.required],
        BillPayment: ['Active', Validators.required],
        MicroATM: ['Active', Validators.required],
        RazorpayPayment: ['Active', Validators.required],
        Settlement: ['Active', Validators.required],
        Status: ['Active', Validators.required],
      }),
      uploadDocs: this.fb.group({
        PancopyFile: [null, Validators.required],
        AadharFrontFile: [null, Validators.required],
        AadharBackFile: [null, Validators.required],
        LogoFile: [null, Validators.required],
        SelfieFile: [null, Validators.required]
      }),

    });

    this.filePreviews = {};
    this.isEditMode = false;

    this.clientId = 0;

    this.modalRef = this.modalService.open(this.clientModal, {
      size: 'xl', backdrop: 'static', keyboard: false
    });

    this.modalRef.result.then(
      (result) => {
        console.log('Closed with:', result);
        // you can refresh the client list etc.
      },
      (reason) => {
        console.log('Dismissed:', reason);
      }
    );
    this.isLoading = false;
  }


  goToNextTab() {
    this.isLoading = true;
    const currentGroup = this.clientForm.get(this.activeTab) as FormGroup;
    if (currentGroup.invalid) {
      this.showValidationMessages(currentGroup);
      this.isLoading = false;
      return;
    }
    const index = this.tabList.findIndex(tab => tab.id === this.activeTab);
    if (index < this.tabList.length - 1) {
      this.activeTab = this.tabList[index + 1].id;
      this.isLoading = false;
    }
    this.isLoading = false;
  }

  goToPreviousTab() {
    const index = this.tabList.findIndex(tab => tab.id === this.activeTab);
    if (index > 0) {
      this.activeTab = this.tabList[index - 1].id;
    }
  }

  prepareModel() {
    const companyInfo = this.clientForm.get('companyInfo')?.value;
    const addressInfo = this.clientForm.get('addressInfo')?.value;
    const shopInfo = this.clientForm.get('shopInfo')?.value;
    const serviceRights = this.clientForm.get('serviceRights')?.value;
    const uploadDocs = this.clientForm.get('uploadDocs')?.value;

    this.model = {
      CompanyName: companyInfo.CompanyName,
      CustomerName: companyInfo.CustomerName,
      FatherName: companyInfo.FatherName,
      UserName: companyInfo.UserName,
      EmailId: companyInfo.EmailId,
      Phone: companyInfo.Phone,
      PanCard: companyInfo.PanCard,
      AadharCard: companyInfo.AadharCard,
      UserType: companyInfo.UserType,

      ShopAddress: shopInfo.ShopAddress,
      ShopState: shopInfo.ShopState,
      ShopCity: shopInfo.ShopCity,
      ShopZipCode: shopInfo.ShopZipCode,
      Latitude: shopInfo.Latitude,
      Longitude: shopInfo.Longitude,

      MDName: '',
      ADName: '',
      ADMINName: '',

      AddressLine1: addressInfo.AddressLine1,
      AddressLine2: addressInfo.AddressLine2,
      State: addressInfo.State,
      City: addressInfo.City,
      Pincode: addressInfo.Pincode,

      Recharge: serviceRights.Recharge,
      MoneyTransfer: serviceRights.MoneyTransfer,
      AEPS: serviceRights.AEPS,
      BillPayment: serviceRights.BillPayment,
      MicroATM: serviceRights.MicroATM,
      RazorpayPayment: serviceRights.RazorpayPayment,
      Settlement: serviceRights.Settlement,
      APITransfer: serviceRights.APITransfer,
      Margin: serviceRights.Margin,
      Debit: serviceRights.Debit,
      Status: serviceRights.Status,

      PlanId: companyInfo.CommissionPlanId,
      PlanName: this.commissionPlans.find(plan => plan.id === Number(companyInfo.CommissionPlanId))?.planName || '',
      RegDate: new Date().toISOString().substring(0, 16)
    };

    // Handle file inputs for preview
    this.files = {
      Logo: this.clientForm.get('uploadDocs.LogoFile')?.value,
      Pancopy: this.clientForm.get('uploadDocs.PancopyFile')?.value,
      AadharFront: this.clientForm.get('uploadDocs.AadharFrontFile')?.value,
      AadharBack: this.clientForm.get('uploadDocs.AadharBackFile')?.value,
      Selfie: this.clientForm.get('uploadDocs.SelfieFile')?.value
    };
  }


  goToPreviewTab() {
    this.isLoading = true;
    const companyinfogroup = this.clientForm.get('companyInfo') as FormGroup;
    if (companyinfogroup.invalid) {
      this.showValidationMessages(companyinfogroup);
      this.isLoading = false;
      return;
    }
    if (!this.isVerified('phone') || !this.isVerified('email') || !this.isVerified('pan') || !this.isVerified('aadhaar')) {
      this.toastr.error('Verify mobile number, email, PAN, and Aadhaar before continuing.');
      this.isLoading = false;
      return;
    }
    const AddressInfoGroup = this.clientForm.get('addressInfo') as FormGroup;
    if (AddressInfoGroup.invalid) {
      this.showValidationMessages(AddressInfoGroup);
      this.isLoading = false;
      return;
    }
    const ShopInfoGroup = this.clientForm.get('shopInfo') as FormGroup;
    if (ShopInfoGroup.invalid) {
      this.showValidationMessages(ShopInfoGroup);
      this.isLoading = false;
      return;
    }
    const servicerightsinfoGroup = this.clientForm.get('serviceRights') as FormGroup;
    if (servicerightsinfoGroup.invalid) {
      this.showValidationMessages(servicerightsinfoGroup);
      this.isLoading = false;
      return;
    }
    const documentGroup = this.clientForm.get('uploadDocs') as FormGroup;
    if (documentGroup.invalid) {
      this.showValidationMessages(documentGroup);
      this.isLoading = false;
      return;
    }
    this.prepareModel();
    this.activeTab = 'previewTab';
    this.isLoading = false;
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
  }

  private getValidationMessage(field: string, errors: any): string {
    if (errors.duplicate) return `${field} already belongs to an active or submitted user.`;
    if (errors.required) return `${field} is required.`;
    if (errors.email) return `${field} must be a valid email.`;
    if (errors.pattern) {
      switch (field) {
        case 'Phone': return 'Phone must be a valid 10-digit number starting with 6-9.';
        case 'PanCard': return 'PAN must be valid (e.g. ABCDE1234F).';
        case 'AadharCard': return 'Aadhar must be 12-digit number.';
        case 'MPin': return 'MPin must be 4 digit number';
        case 'Password': return 'Password must be 10+ chars, include letters, number & special char.';
        case 'Pincode': return 'Pincode must be 6-digit number.';
        case 'ShopZipCode': return 'ShopZipCode must be 6-digit number.';
        case 'Latitude': return 'Latitude must contain no more than 5 decimal places.';
        case 'Longitude': return 'Longitude must contain no more than 5 decimal places.';
        default: return `${field} format is invalid.`;
      }
    }
    return `${field} is invalid.`;
  }

  onSubmit(): void {

    this.isLoading = true;
    if (this.clientForm.invalid) {
      this.toastr.error('Please fill all required fields correctly.', 'Validation Error');
      this.clientForm.markAllAsTouched();
      this.isLoading = false;
      return;
    }
    if (!this.isVerified('phone') || !this.isVerified('email') || !this.isVerified('pan') || !this.isVerified('aadhaar')) {
      this.toastr.error('Verify mobile number, email, PAN, and Aadhaar before submitting.');
      this.isLoading = false;
      return;
    }

    const formData = new FormData();
    const companyInfo = this.clientForm.get('companyInfo')?.value;
    formData.append('ClientId', this.clientId?.toString() || '0');
    formData.append('CompanyName', companyInfo.CompanyName);
    formData.append('UserName', companyInfo.UserName);
    formData.append('EmailId', companyInfo.EmailId);
    formData.append('Phone', companyInfo.Phone);
    formData.append('PanCard', companyInfo.PanCard);
    formData.append('AadharCard', companyInfo.AadharCard);
    formData.append('UserType', companyInfo.UserType);
    formData.append('CustomerName', companyInfo.CustomerName);
    formData.append('FatherName', companyInfo.FatherName);
    formData.append('CommissionPlanId', String(companyInfo.CommissionPlanId));
    formData.append('MobileVerificationToken', this.mobileVerificationToken);
    formData.append('EmailVerificationToken', this.emailVerificationToken);
    formData.append('PanVerificationToken', this.panVerificationToken);
    formData.append('AadharVerificationToken', this.aadhaarVerificationToken);

    const addressInfo = this.clientForm.get('addressInfo')?.value;
    formData.append('AddressLine1', addressInfo.AddressLine1);
    formData.append('AddressLine2', addressInfo.AddressLine2);
    formData.append('State', addressInfo.State);
    formData.append('City', addressInfo.City);
    formData.append('Pincode', addressInfo.Pincode);

    const shopaddressInfo = this.clientForm.get('shopInfo')?.value;
    formData.append('ShopAddress', shopaddressInfo.ShopAddress);
    formData.append('ShopState', shopaddressInfo.ShopState);
    formData.append('ShopCity', shopaddressInfo.ShopCity);
    formData.append('ShopZipCode', shopaddressInfo.ShopZipCode);

    const serviceRights = this.clientForm.get('serviceRights')?.value;
    formData.append('Recharge', serviceRights.Recharge);
    formData.append('MoneyTransfer', serviceRights.MoneyTransfer);
    formData.append('AEPS', serviceRights.AEPS);
    formData.append('BillPayment', serviceRights.BillPayment);
    formData.append('MicroATM', serviceRights.MicroATM);
    formData.append('RazorpayPayment', serviceRights.RazorpayPayment);
    formData.append('Settlement', serviceRights.Settlement);
    formData.append('Status', serviceRights.Status);

    // Flat fields outside nested groups
    formData.append('lat', String(shopaddressInfo.Latitude));
    formData.append('longitute', String(shopaddressInfo.Longitude));

    formData.append('WLID', this.MainclientId?.toString() || '0');
    formData.append('ScopeType', this.scopeType);

    // Append files (from uploadedFiles object)
    ['PancopyFile', 'AadharFrontFile', 'AadharBackFile', 'LogoFile', 'SelfieFile'].forEach(key => {
      const file = this.uploadedFiles[key];
      if (file instanceof File) {
        formData.append(key, file, file.name);
      }
    });

    this.http.post<any>(`${this.apiUrl}/v1/partner/users/CreateOrUpdateClient`, formData).subscribe({
      next: (res) => {
        if (res.flag) {
          this.toastr.success(res.msg, 'Success');
          this.clientForm.reset();
          this.modalRef.close('success');
          this.isLoading = false;
          this.loadClients(1, this.pageSize);
        } else {
          this.toastr.error(res.msg, 'Error');
          this.isLoading = false;
        }
      },
      error: () => {
        this.toastr.error('Something went wrong while submitting the form.', 'Error');
        this.isLoading = false;
      }
    });
  }


  editClient(clientId: number): void {
    this.isLoading = true;
    this.activeTab = 'companyInfo';
    this.http.get<any>(`${this.apiUrl}/v1/partner/users/clientId?Id=${clientId}`).subscribe({
      next: (res) => {

        this.clientForm.get('companyInfo')?.patchValue({
          CompanyName: res.companyName,
          UserType: res.userType,
          CustomerName: res.customerName,
          FatherName: res.fatherName,
          UserName: res.userName,
          EmailId: res.emailId,
          Phone: res.phone,
          // Password: this.encryptor.decrypt(res.password),
          Password: res.password,
          PanCard: res.panCard,
          AadharCard: res.aadharCard,
          //MPin: this.encryptor.decrypt(res.mPin)
          MPin: res.mPin,
          CommissionPlanId: res.commissionPlanId
        });

        this.clientForm.get('addressInfo')?.patchValue({
          AddressLine1: res.addressLine1,
          AddressLine2: res.addressLine2,
          State: res.state,
          City: res.city,
          Pincode: res.pincode
        });

        this.clientForm.get('shopInfo')?.patchValue({
          ShopAddress: res.shopAddress,
          ShopState: res.shopState,
          ShopCity: res.shopCity,
          ShopZipCode: res.shopZipCode,
          Latitude: res.lat,
          Longitude: res.longitute
        });

        this.clientForm.get('serviceRights')?.patchValue({
          Recharge: res.mobileRecharge,
          MoneyTransfer: res.moneyTransfer,
          AEPS: res.aeps,
          BillPayment: res.billPayment,
          MicroATM: res.microATM,
          RazorpayPayment: res.razorpayPayment,
          Settlement: res.settlement,
          Status: res.status
        });


        // Set uploaded file paths (for preview)
        const uploadGroup = this.clientForm.get('uploadDocs') as FormGroup;

        // PAN Copy
        if (res.pancopy) {
          uploadGroup.get('PancopyFile')?.removeValidators(Validators.required);
        }

        // Aadhar Front
        if (res.aadharFront) {
          uploadGroup.get('AadharFrontFile')?.removeValidators(Validators.required);
        }

        // Aadhar Back
        if (res.aadharBack) {
          uploadGroup.get('AadharBackFile')?.removeValidators(Validators.required);
        }

        // Logo
        if (res.logo) {
          uploadGroup.get('LogoFile')?.removeValidators(Validators.required);
        }
        if (res.selfieImage) {
          uploadGroup.get('SelfieFile')?.removeValidators(Validators.required);
        }

        // Update validity
        Object.values(uploadGroup.controls).forEach(control => control.updateValueAndValidity());

        this.filePreviews = {
          LogoFile: res.logo != null && res.logo != '' ? this.baseUrl + res.logo : '',
          PancopyFile: res.pancopy != null && res.pancopy != '' ? this.baseUrl + res.pancopy : '',
          AadharFrontFile: res.aadharFront != null && res.aadharFront != '' ? this.baseUrl + res.aadharFront : '',
          AadharBackFile: res.aadharBack != null && res.aadharBack != '' ? this.baseUrl + res.aadharBack : '',
          SelfieFile: res.selfieImage != null && res.selfieImage != '' ? this.baseUrl + res.selfieImage : ''
        };

        this.resetVerificationState();
        this.verifiedValues = {
          phone: String(res.phone || '').trim(),
          email: String(res.emailId || '').trim().toLowerCase(),
          pan: String(res.panCard || '').trim().toUpperCase(),
          aadhaar: String(res.aadharCard || '').trim()
        };
        this.persistedVerification = {
          phone: !!res.isPhoneVerified,
          email: !!res.isEmailVerified,
          pan: !!res.isPanVerified,
          aadhaar: !!res.isAadhaarVerified
        };
        this.panVerifiedName = res.panVerifiedName || '';

        this.clientId = res.id; // Store for update
        this.isEditMode = true; // Flag for UI update
        this.modalRef = this.modalService.open(this.clientModal, {
          size: 'xl', backdrop: 'static', keyboard: false
        });

        this.modalRef.result.then(
          (result) => {
            console.log('Closed with:', result);
            // you can refresh the client list etc.
          },
          (reason) => {
            console.log('Dismissed:', reason);
          }
        );
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load client details', 'Error');
        this.isLoading = false;
      }
    });
  }


  ViewClient(clientId: number): void {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/v1/partner/users/clientId?Id=${clientId}`).subscribe({
      next: (res) => {


        this.model = {

          CompanyName: res.companyName,
          CustomerName: res.customerName,
          FatherName: res.fatherName,
          UserName: res.userName,
          EmailId: res.emailId,
          Phone: res.phone,
          //Password: this.encryptor.decrypt(res.password),
          Password: res.password,
          PanCard: res.panCard,
          AadharCard: res.aadharCard,
          //MPin: this.encryptor.decrypt(res.mPin),
          MPin: res.mPin,
          UserType: res.userType,
          ShopAddress: res.shopAddress,
          ShopState: res.shopState,
          ShopCity: res.shopCity,
          ShopZipCode: res.shopZipCode,
          Latitude: res.lat,
          Longitude: res.longitute,
          MDName: res.mdName,
          ADName: res.adName,
          ADMINName: res.adminName,
          AddressLine1: res.addressLine1,
          AddressLine2: res.addressLine2,
          State: res.state,
          City: res.city,
          Pincode: res.pincode,
          Recharge: res.mobileRecharge,
          MoneyTransfer: res.moneyTransfer,
          AEPS: res.aeps,
          BillPayment: res.billPayment,
          MicroATM: res.microATM,
          APITransfer: res.apiTransfer,
          Margin: res.margin,
          Debit: res.debit,
          Status: res.status,
          TxnPin: res.txnPin,
          PlanId: res.commissionPlanId,
          PlanName: this.commissionPlans.find(plan => plan.id === Number(res.commissionPlanId))?.planName || '',
          IsPhoneVerified: res.isPhoneVerified,
          IsEmailVerified: res.isEmailVerified,
          IsPanVerified: res.isPanVerified,
          PanVerifiedName: res.panVerifiedName,
          IsAadhaarVerified: res.isAadhaarVerified,
          RegDate: new Date().toISOString().substring(0, 16)
        };
        this.filePreviews = {
          LogoFile: res.logo != null && res.logo != '' ? this.baseUrl + res.logo : '',
          PancopyFile: res.pancopy != null && res.pancopy != '' ? this.baseUrl + res.pancopy : '',
          AadharFrontFile: res.aadharFront != null && res.aadharFront != '' ? this.baseUrl + res.aadharFront : '',
          AadharBackFile: res.aadharBack != null && res.aadharBack != '' ? this.baseUrl + res.aadharBack : '',
          SelfieFile: res.selfieImage != null && res.selfieImage != '' ? this.baseUrl + res.selfieImage : ''
        };
        this.modalRef = this.modalService.open(this.ViewclientDetailsModel, {
          size: 'lg', backdrop: 'static', keyboard: false
        });

        this.modalRef.result.then(
          (result) => {
            console.log('Closed with:', result);
            // you can refresh the client list etc.
          },
          (reason) => {
            console.log('Dismissed:', reason);
          }
        );
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load client details', 'Error');
        this.isLoading = false;
      }
    });
  }

  export(type: string): void {
    this.isLoading = true;
    if (type === 'pdf') {
      const el = document.querySelector('.table-responsive') as HTMLElement;
      if (!el) return;
      import('html2pdf.js').then(html2pdf => {
        html2pdf.default().from(el).save('Client_Report.pdf');
        this.isLoading = false;
      });
    } else {
      import('xlsx').then(xlsx => {
        const worksheet = xlsx.utils.json_to_sheet(this.paginatedUsers);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const ext = type === 'doc' ? 'xls' : type;
        xlsx.writeFile(workbook, `Client_Report.${ext}`);
        this.isLoading = false;
      });
    }
    this.isLoading = false;
  }

  //PayClient
  PayClient(clientId: number, name: string, phoneno: string): void {
    this.walletTxn.userId = clientId;
    this.walletTxn.userName = name;
    this.walletTxn.PhoneNo = phoneno;
    this.modalRef = this.modalService.open(this.PayClientmodal, {
      size: 'md', backdrop: 'static', keyboard: false
    });

    this.modalRef.result.then(
      (result) => {
        console.log('Closed with:', result);
      },
      (reason) => {
        console.log('Dismissed:', reason);
      }
    );
  }

  submitWalletTxn() {
    
    this.isLoading = true;

    if (!this.authServiceobj.getUserId() || !this.authServiceobj.getUserId()) {
      this.toastr.error('Session expired. Please login.');
      this.router.navigate(['/login']);
      return;
    }
    this.walletTxn.actionById = Number(this.authServiceobj.getUserId());


    if (this.walletTxn.amount == null || this.walletTxn.amount == '' || this.walletTxn.amount == 0) {
      this.toastr.error('Amount should be greater than 0', 'error');
      this.isLoading = false;
      return;
    }
    if (this.walletTxn.txnPin == null || this.walletTxn.txnPin == '') {
      this.toastr.error('Please Enter Txn Pin', 'error');
      this.isLoading = false;
      return;
    }
    if (this.walletTxn.txnRemarks.trim() === "") {
      this.toastr.error('Please Enter Txn Remarks', 'error');
      this.isLoading = false;
      return;
    }
    const payload = {
      status: this.walletTxn.status,
      txnPin: this.walletTxn.txnPin,
      amount: Number(this.walletTxn.amount),
      userId: Number(this.walletTxn.userId),
      actionById: Number(this.walletTxn.actionById),
      remarks: this.walletTxn.txnRemarks
    };

    this.http.post<any>(`${this.apiUrl}/v1/partner/users/wallet-transaction`, payload).subscribe({
      next: (response) => {
        if (response.isSuccessful) {

          this.walletTxn.userId = 0;
          this.walletTxn.actionById = 0;

          this.isLoading = false;
          this.walletTxn = {
            status: 'Credit',
            txnPin: '',
            amount: null,
            userId: 0,
            actionById: 0,
            PhoneNo: '',
            userName: '',
            txnRemarks: ''
          };

          this.Username = response.username;
          this.Oldbalance = response.oldbalance;
          this.NewBalance = response.newBalance;
          this.Amount = response.amount;
          this.TxnType = response.txnType;
          this.CrdrType = response.crdrType;
          this.Remarks = response.remarks;
          this.Txndate = response.txndate;
          this.ErrorMessages = response.errorMessage
          this.toastr.success(response.errorMessage);
          this.modalRef = this.modalService.open(this.invoiceModal, {
            size: 'lg', backdrop: 'static', keyboard: false
          });

        } else {
          this.toastr.error(response.errorMessage || 'Transaction failed');
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.toastr.error('API error: ' + err.message);
        this.isLoading = false;
      }
    });
  }

  ResetPopupValues() {
    this.Username = '';
    this.Oldbalance = '';
    this.NewBalance = '';
    this.Amount = '';
    this.TxnType = '';
    this.CrdrType = '';
    this.Remarks = '';
    this.Txndate = new Date();
    this.ErrorMessages = '';
  }

  ClosePaypopup() {

    this.ResetPopupValues();
    this.ResetPayPopup();
    this.loadClients(1, this.pageSize);
    this.modalService.dismissAll();
  }

  ResetPayPopup() {

    //this.walletTxn.status = '';
    this.walletTxn.txnPin = '';
    this.walletTxn.amount = null;
    this.walletTxn.userId = 0;
    this.walletTxn.PhoneNo = '';
    this.walletTxn.userName = '';
    this.walletTxn.txnRemarks = '';
    //this.walletTxn.actionById = 0;

  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadClients(1, this.pageSize);
  }

  downloadInvoice() {
    this.isLoading = true;
    const original = document.getElementById('invoiceContent')!;

    // 🔹 Inject temporary styles to avoid clipping
    const style = document.createElement('style');
    style.innerHTML = `
    #invoiceContent, .invoice, .modal-body {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }
    table, tr, td, th {
      page-break-inside: avoid !important;
    }
    .html2pdf__page-break {
      page-break-before: always;
    }
  `;
    document.head.appendChild(style);

    html2pdf().set({
      margin: 0.2,
      filename: 'ClientPay_Invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(original).save().finally(() => {
      // 🔹 Remove temp styles after export
      document.head.removeChild(style);
      this.isLoading = false;
    });
  }



}
