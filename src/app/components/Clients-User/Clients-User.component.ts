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
import { Router, ActivatedRoute } from '@angular/router';
import html2pdf from 'html2pdf.js';
import { EncryptionService } from '../../encryption/encryption.service';

@Component({
  selector: 'app-client-user',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, LoaderComponent, CommonModule, NgbTypeaheadModule, NgbToastModule],
  templateUrl: './Clients-User.component.html',
  styleUrls: ['./Clients-User.component.scss']
})

export class ClientUserDetailComponent implements OnInit {

  MainclientId!: number;
  private authServiceobj = inject(AuthService);
  private router = inject(Router);

  walletTxn = {
    status: 'Credit',
    txnPin: '',
    amount: null,
    userId: 0,
    actionById: 0
  };

  modalRef!: NgbModalRef;
  baseUrl = 'http://ec2-54-175-38-116.compute-1.amazonaws.com/';
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
  model: any = {

    CompanyName: '',
    UserName: '',
    EmailId: '',
    Phone: '',
    Password: '',
    PanCard: '',
    AadharCard: '',
    CustomerName: '',
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
    Status: 'Active',
    RegDate: new Date().toISOString().substring(0, 16),
    TxnPin: '',
    PlanId: ''
  };

  files: any = {
    Logo: null,
    Pancopy: null,
    AadharFront: null,
    AadharBack: null
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
  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 7;
  visiblePages: (number | null)[] = [];

  @ViewChild('clientModel', { static: true }) clientModal!: TemplateRef<any>;
  @ViewChild('ViewclientDetailsModel', { static: true }) ViewclientDetailsModel!: TemplateRef<any>;
  @ViewChild('PayClientModel', { static: true }) PayClientmodal !: TemplateRef<any>;
  @ViewChild('invoiceModal', { static: true }) invoiceModal !: TemplateRef<any>;
  constructor(private fb: FormBuilder, private http: HttpClient, private toastr: ToastrService, private _clientservice: ClientReportService, private modalService: NgbModal, private route: ActivatedRoute, private encryptor: EncryptionService) {

    this.clientForm = this.fb.group({
      companyInfo: this.fb.group({
        UserType: ['MD', Validators.required],
        CompanyName: ['', Validators.required],
        CustomerName: ['', Validators.required],
        UserName: ['', Validators.required],
        EmailId: ['', [Validators.required, Validators.email]],
        Phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        Password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/)]],
        PanCard: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
        AadharCard: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],

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
        ShopZipCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
      }),
      serviceRights: this.fb.group({
        Recharge: ['Active', Validators.required],
        MoneyTransfer: ['Active', Validators.required],
        AEPS: ['Active', Validators.required],
        BillPayment: ['Active', Validators.required],
        MicroATM: ['Active', Validators.required],
        Status: ['Active', Validators.required],
      }),
      uploadDocs: this.fb.group({
        PancopyFile: [null, Validators.required],
        AadharFrontFile: [null, Validators.required],
        AadharBackFile: [null, Validators.required],
        LogoFile: [null, Validators.required]
      }),
      TxnPin: ['9999', Validators.required]

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

    this.http.delete(`http://ec2-54-175-38-116.compute-1.amazonaws.com/api/ClientUser/delete-file?clientId=${FileId}&fileType=${controlName}`)
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

  get uploadDocsForm() {
    return this.clientForm.get('uploadDocs') as FormGroup;
  }

  ngOnInit() {

    this.setCurrentLocation();
    this.MainclientId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadClients(this.currentPage, this.pageSize);
  }

  loadClients(pageIndex: number, pageSize: number): void {
    this.isLoading = true;
    const payload: GetUsersWithMainBalanceQuery = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      pageIndex,
      pageSize,
      ClientId: this.MainclientId
    };


    this._clientservice.getClientUserReport(payload).subscribe({
      next: (res: any) => {
        debugger
        this.users = res.Users || [];
        this.totalRecords = res.TotalRecords || 0;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = pageIndex;
        this.updateVisiblePages();
        this.TotalBalance = res.TotalBalance || 0
        this.isLoading = false;
        this.applyFilter();
      },
      error: () => (this.isLoading = false),
    });
  }

  async setCurrentLocation(): Promise<void> {
    this.lat = await this.getCurrentLatitude();
    this.lng = await this.getCurrentLongitude();
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
    this.paginatedUsers = this.users.filter(user =>
      user.UserName?.toLowerCase().includes(keyword) ||
      user.CompanyName?.toLowerCase().includes(keyword) ||
      user.Domain?.toLowerCase().includes(keyword) ||
      user.City?.toLowerCase().includes(keyword) ||
      user.Status?.toLowerCase().includes(keyword) ||
      user.EmailId?.toLowerCase().includes(keyword)//||
      //user.MainBalance.includes(keyword)

    );
    this.isLoading = false;
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
      APITransfer: 'Active',
      Margin: 'Active',
      Debit: 'Active',
      Status: 'Active',
      RegDate: new Date().toISOString().substring(0, 16),
      TxnPin: '',
      PlanId: ''
    };

    this.files = {
      Logo: null,
      Pancopy: null,
      AadharFront: null,
      AadharBack: null
    };

    this.clientForm = this.fb.group({
      companyInfo: this.fb.group({
        UserType: ['MD', Validators.required],
        CompanyName: ['', Validators.required],
        CustomerName: ['', Validators.required],
        UserName: ['', Validators.required],
        EmailId: ['', [Validators.required, Validators.email]],
        Phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        Password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/)]],
        PanCard: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
        AadharCard: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],

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
        ShopZipCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
      }),
      serviceRights: this.fb.group({
        Recharge: ['Active', Validators.required],
        MoneyTransfer: ['Active', Validators.required],
        AEPS: ['Active', Validators.required],
        BillPayment: ['Active', Validators.required],
        MicroATM: ['Active', Validators.required],
        Status: ['Active', Validators.required],
      }),
      uploadDocs: this.fb.group({
        PancopyFile: [null, Validators.required],
        AadharFrontFile: [null, Validators.required],
        AadharBackFile: [null, Validators.required],
        LogoFile: [null, Validators.required]
      }),
      TxnPin: ['9999', Validators.required]

    });

    this.filePreviews = {};
    this.isEditMode = false;

    this.clientId=0;

    this.modalRef = this.modalService.open(this.clientModal, {
      size: 'xl',
      backdrop: true,
      keyboard: true,
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
      UserName: companyInfo.UserName,
      EmailId: companyInfo.EmailId,
      Phone: companyInfo.Phone,
      Password: companyInfo.Password,
      PanCard: companyInfo.PanCard,
      AadharCard: companyInfo.AadharCard,
      UserType: companyInfo.UserType,

      ShopAddress: shopInfo.ShopAddress,
      ShopState: shopInfo.ShopState,
      ShopCity: shopInfo.ShopCity,
      ShopZipCode: shopInfo.ShopZipCode,

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
      APITransfer: serviceRights.APITransfer,
      Margin: serviceRights.Margin,
      Debit: serviceRights.Debit,
      Status: serviceRights.Status,

      TxnPin: this.clientForm.get('TxnPin')?.value,
      PlanId: this.clientForm.get('PlanId')?.value,
      RegDate: new Date().toISOString().substring(0, 16)
    };

    // Handle file inputs for preview
    this.files = {
      Logo: this.clientForm.get('uploadDocs.LogoFile')?.value,
      Pancopy: this.clientForm.get('uploadDocs.PancopyFile')?.value,
      AadharFront: this.clientForm.get('uploadDocs.AadharFrontFile')?.value,
      AadharBack: this.clientForm.get('uploadDocs.AadharBackFile')?.value
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
    if (errors.required) return `${field} is required.`;
    if (errors.email) return `${field} must be a valid email.`;
    if (errors.pattern) {
      switch (field) {
        case 'Phone': return 'Phone must be a valid 10-digit number starting with 6-9.';
        case 'PanCard': return 'PAN must be valid (e.g. ABCDE1234F).';
        case 'AadharCard': return 'Aadhar must be 12-digit number.';
        case 'Password': return 'Password must be 10+ chars, include letters, number & special char.';
        case 'Pincode': return 'Pincode must be 6-digit number.';
        case 'ShopZipCode': return 'ShopZipCode must be 6-digit number.';
        default: return `${field} format is invalid.`;
      }
    }
    return `${field} is invalid.`;
  }

  getCurrentLatitude(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position.coords.latitude.toString()),
        error => alert(error.message)
      );
    });
  }

  getCurrentLongitude(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position.coords.longitude.toString()),
        error => alert(error.message)
      );
    });
  }


  onSubmit(): void {

    this.isLoading = true;
    // if (this.clientForm.invalid) {
    //   this.toastr.error('Please fill all required fields correctly.', 'Validation Error');
    //   this.clientForm.markAllAsTouched();
    //   this.isLoading = false;
    //   return;
    // }

    const formData = new FormData();
    const companyInfo = this.clientForm.get('companyInfo')?.value;
    formData.append('ClientId', this.clientId?.toString() || '0');
    formData.append('CompanyName', companyInfo.CompanyName);
    formData.append('UserName', companyInfo.UserName);
    formData.append('EmailId', companyInfo.EmailId);
    formData.append('Phone', companyInfo.Phone);
    formData.append('Password', this.encryptor.encrypt(companyInfo.Password));
    formData.append('PanCard', companyInfo.PanCard);
    formData.append('AadharCard', companyInfo.AadharCard);
    formData.append('UserType', companyInfo.UserType);
    formData.append('CustomerName', companyInfo.CustomerName);

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
    formData.append('Status', serviceRights.Status);

    // Flat fields outside nested groups
    formData.append('TxnPin', '9999');
    formData.append('lat', this.lat);
    formData.append('longitute', this.lng);

    formData.append('WLID', this.MainclientId?.toString() || '0');

    // Append files (from uploadedFiles object)
    ['PancopyFile', 'AadharFrontFile', 'AadharBackFile', 'LogoFile'].forEach(key => {
      const file = this.uploadedFiles[key];
      if (file instanceof File) {
        formData.append(key, file, file.name);
      }
    });

    this.http.post<any>('http://ec2-54-175-38-116.compute-1.amazonaws.com/api/ClientUser/CreateOrUpdateClient', formData).subscribe({
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
    this.http.get<any>(`http://ec2-54-175-38-116.compute-1.amazonaws.com/api/ClientUser/clientId?Id=${clientId}`).subscribe({
      next: (res) => {

        this.clientForm.get('companyInfo')?.patchValue({
          CompanyName: res.companyName,
          UserType: res.userType,
          CustomerName: res.customerName,
          UserName: res.userName,
          EmailId: res.emailId,
          Phone: res.phone,
          Password: this.encryptor.decrypt(res.password),
          PanCard: res.panCard,
          AadharCard: res.aadharCard
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
          ShopZipCode: res.shopZipCode
        });

        this.clientForm.get('serviceRights')?.patchValue({
          Recharge: res.recharge,
          MoneyTransfer: res.moneyTransfer,
          AEPS: res.aeps,
          BillPayment: res.billPayment,
          MicroATM: res.microATM,
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

        // Update validity
        Object.values(uploadGroup.controls).forEach(control => control.updateValueAndValidity());

        this.filePreviews = {
          LogoFile: res.logo != null && res.logo != '' ? this.baseUrl + res.logo : '',
          PancopyFile: res.pancopy != null && res.pancopy != '' ? this.baseUrl + res.pancopy : '',
          AadharFrontFile: res.aadharFront != null && res.aadharFront != '' ? this.baseUrl + res.aadharFront : '',
          AadharBackFile: res.aadharBack != null && res.aadharBack != '' ? this.baseUrl + res.aadharBack : ''
        };

        this.clientId = res.id; // Store for update
        this.isEditMode = true; // Flag for UI update
        this.modalRef = this.modalService.open(this.clientModal, {
          size: 'xl',
          backdrop: true,
          keyboard: true,
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
    this.http.get<any>(`http://ec2-54-175-38-116.compute-1.amazonaws.com/api/ClientUser/clientId?Id=${clientId}`).subscribe({
      next: (res) => {


        this.model = {

          CompanyName: res.companyName,
          CustomerName: res.customerName,
          UserName: res.userName,
          EmailId: res.emailId,
          Phone: res.phone,
          Password: this.encryptor.decrypt(res.password),
          PanCard: res.panCard,
          AadharCard: res.aadharCard,
          UserType: res.userType,


          ShopAddress: res.shopAddress,
          ShopState: res.shopState,
          ShopCity: res.shopCity,
          ShopZipCode: res.shopZipCode,

          MDName: res.mdName,
          ADName: res.adName,
          ADMINName: res.adminName,


          AddressLine1: res.addressLine1,
          AddressLine2: res.addressLine2,
          State: res.state,
          City: res.city,
          Pincode: res.pincode,

          Recharge: res.recharge,
          MoneyTransfer: res.moneyTransfer,
          AEPS: res.aeps,
          BillPayment: res.billPayment,
          MicroATM: res.microATM,
          APITransfer: res.apiTransfer,
          Margin: res.margin,
          Debit: res.debit,
          Status: res.status,
          TxnPin: res.txnPin,
          PlanId: res.planId,
          RegDate: new Date().toISOString().substring(0, 16)
        };
        this.filePreviews = {
          LogoFile: res.logo != null && res.logo != '' ? this.baseUrl + res.logo : '',
          PancopyFile: res.pancopy != null && res.pancopy != '' ? this.baseUrl + res.pancopy : '',
          AadharFrontFile: res.aadharFront != null && res.aadharFront != '' ? this.baseUrl + res.aadharFront : '',
          AadharBackFile: res.aadharBack != null && res.aadharBack != '' ? this.baseUrl + res.aadharBack : ''
        };
        this.modalRef = this.modalService.open(this.ViewclientDetailsModel, {
          size: 'lg',
          backdrop: true,
          keyboard: true,
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
  PayClient(clientId: number): void {
    this.walletTxn.userId = clientId;
    this.modalRef = this.modalService.open(this.PayClientmodal, {
      size: 'md',
      backdrop: true,
      keyboard: true,
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
    debugger
    this.isLoading = true;

    if (!this.authServiceobj.getUserId() || !this.authServiceobj.getUserId()) {
      this.toastr.error('Session expired. Please login.');
      this.router.navigate(['/login']);
      return;
    }
    this.walletTxn.actionById = this.authServiceobj.getUserId();

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
    const payload = {
      status: this.walletTxn.status,
      txnPin: this.walletTxn.txnPin,
      amount: Number(this.walletTxn.amount),
      userId: Number(this.walletTxn.userId),
      actionById: Number(this.walletTxn.actionById)
    };

    this.http.post<any>('http://ec2-54-175-38-116.compute-1.amazonaws.com/api/ClientUser/wallet-transaction', payload).subscribe({
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
            actionById: 0
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
            size: 'lg',
            backdrop: true,
            keyboard: true,
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

    this.walletTxn.status = '';
    this.walletTxn.txnPin = '';
    this.walletTxn.amount = null;
    this.walletTxn.userId = 0;
    this.walletTxn.actionById = 0;

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
      filename: 'ClientPay_Invoice.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(clone).save();
    this.isLoading = false;
  }

}


