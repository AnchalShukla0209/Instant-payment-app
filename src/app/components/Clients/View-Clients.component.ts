import { Component, OnInit, ViewChild, TemplateRef, inject } from '@angular/core';
import { GetUsersWithMainBalanceQuery } from '../../models/ClientData';
import { ClientReportService } from '../../services/Client-report.service';
import { HttpClient } from '@angular/common/http';
import { LoaderComponent } from '../app-loader/loader.component';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbTypeaheadModule, NgbToastModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-txn-report',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, LoaderComponent, CommonModule, NgbTypeaheadModule, NgbToastModule],
  templateUrl: './View-Clients.component.html',
  styleUrls: ['./View-Clients.component.scss']
})

export class ClientViewListComponent implements OnInit {

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
  baseUrl = 'https://localhost:7003/';
  clientForm: FormGroup;
  filePreviews: any = {}; // holds path strings
  isEditMode: boolean = false;
  clientId: number = 0;
  model: any = {
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
    { id: 'serviceRights', label: 'SERVICE RIGHTS INFO' },
    { id: 'uploadDocs', label: 'DOCUMENT' }
  ];

  // files: { [key: string]: File } = {};



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


  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 7;
  visiblePages: (number | null)[] = [];

  @ViewChild('clientModel', { static: true }) clientModal!: TemplateRef<any>;
  @ViewChild('ViewclientDetailsModel', { static: true }) ViewclientDetailsModel!: TemplateRef<any>;
  @ViewChild('PayClientModel', { static: true }) PayClientmodal !: TemplateRef<any>;
  constructor(private fb: FormBuilder, private http: HttpClient, private toastr: ToastrService, private _clientservice: ClientReportService, private modalService: NgbModal) {

    this.clientForm = this.fb.group({
      companyInfo: this.fb.group({
        CompanyName: ['', Validators.required],
        UserName: ['', Validators.required],
        EmailId: ['', [Validators.required, Validators.email]],
        Phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        Password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/)]],
        PanCard: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
        AadharCard: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
        DomainName: ['', Validators.required]
      }),
      addressInfo: this.fb.group({
        AddressLine1: ['', Validators.required],
        AddressLine2: ['', Validators.required],
        State: ['', Validators.required],
        City: ['', Validators.required],
        Pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
      }),
      serviceRights: this.fb.group({
        Recharge: ['Active', Validators.required],
        MoneyTransfer: ['Active', Validators.required],
        AEPS: ['Active', Validators.required],
        BillPayment: ['Active', Validators.required],
        MicroATM: ['Active', Validators.required],
        APITransfer: ['Active', Validators.required],
        Margin: ['Active', Validators.required],
        Debit: ['Active', Validators.required],
        Status: ['Active', Validators.required],
      }),
      uploadDocs: this.fb.group({
        PancopyFile: [null, Validators.required],
        AadharFrontFile: [null, Validators.required],
        AadharBackFile: [null, Validators.required],
        LogoFile: [null, Validators.required]
      }),
      TxnPin: ['9999', Validators.required],
      PlanId: ['1', Validators.required],
    });
  }

  onFileChange(event: any, fileType: string) {
    this.isLoading = true;
    const file = event.target.files[0];
    if (file) {
      this.uploadedFiles[fileType] = file;
      this.filePreviews[fileType] = URL.createObjectURL(file);
      this.uploadDocsForm.get(fileType)?.setValue(file);
      this.uploadDocsForm.get(fileType)?.markAsTouched();
      this.isLoading = false;
    }
    this.isLoading = false;
  }

  deleteFile(controlName: string, FileId: Number): void {
    this.isLoading = true;
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
    if (!confirm(`Are you sure you want to delete ${controlName}?`)) {
      return;
    }
    this.http.delete(`https://localhost:7003/api/Client/delete-file?clientId=${FileId}&fileType=${controlName}`)
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
    this.loadClients(this.currentPage, this.pageSize);
  }

  loadClients(pageIndex: number, pageSize: number): void {
    this.isLoading = true;
    const payload: GetUsersWithMainBalanceQuery = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      pageIndex,
      pageSize,
    };


    this._clientservice.getClientReport(payload).subscribe({
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
        CompanyName: ['', Validators.required],
        UserName: ['', Validators.required],
        EmailId: ['', [Validators.required, Validators.email]],
        Phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
        Password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/)]],
        PanCard: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
        AadharCard: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
        DomainName: ['', Validators.required]
      }),
      addressInfo: this.fb.group({
        AddressLine1: ['', Validators.required],
        AddressLine2: ['', Validators.required],
        State: ['', Validators.required],
        City: ['', Validators.required],
        Pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
      }),
      serviceRights: this.fb.group({
        Recharge: ['Active', Validators.required],
        MoneyTransfer: ['Active', Validators.required],
        AEPS: ['Active', Validators.required],
        BillPayment: ['Active', Validators.required],
        MicroATM: ['Active', Validators.required],
        APITransfer: ['Active', Validators.required],
        Margin: ['Active', Validators.required],
        Debit: ['Active', Validators.required],
        Status: ['Active', Validators.required],
      }),
      uploadDocs: this.fb.group({
        PancopyFile: [null, Validators.required],
        AadharFrontFile: [null, Validators.required],
        AadharBackFile: [null, Validators.required],
        LogoFile: [null, Validators.required]
      }),
      TxnPin: ['9999', Validators.required],
      PlanId: ['1', Validators.required],
    });

    this.filePreviews = {};
    this.isEditMode = false;

    this.modalRef = this.modalService.open(this.clientModal, {
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
    const serviceRights = this.clientForm.get('serviceRights')?.value;
    const uploadDocs = this.clientForm.get('uploadDocs')?.value;

    this.model = {
      CompanyName: companyInfo.CompanyName,
      UserName: companyInfo.UserName,
      EmailId: companyInfo.EmailId,
      Phone: companyInfo.Phone,
      Password: companyInfo.Password,
      PanCard: companyInfo.PanCard,
      AadharCard: companyInfo.AadharCard,
      DomainName: companyInfo.DomainName,

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

    const formData = new FormData();
    // Flatten and append companyInfo group
    const companyInfo = this.clientForm.get('companyInfo')?.value;
    //this.clientId
    formData.append('ClientId', this.clientId?.toString() || '0');
    formData.append('CompanyName', companyInfo.CompanyName);
    formData.append('UserName', companyInfo.UserName);
    formData.append('EmailId', companyInfo.EmailId);
    formData.append('Phone', companyInfo.Phone);
    formData.append('Password', companyInfo.Password);
    formData.append('PanCard', companyInfo.PanCard);
    formData.append('AadharCard', companyInfo.AadharCard);
    formData.append('DomainName', companyInfo.DomainName);

    // Flatten and append addressInfo group
    const addressInfo = this.clientForm.get('addressInfo')?.value;
    formData.append('AddressLine1', addressInfo.AddressLine1);
    formData.append('AddressLine2', addressInfo.AddressLine2);
    formData.append('State', addressInfo.State);
    formData.append('City', addressInfo.City);
    formData.append('Pincode', addressInfo.Pincode);

    // Flatten and append serviceRights group
    const serviceRights = this.clientForm.get('serviceRights')?.value;
    formData.append('Recharge', serviceRights.Recharge);
    formData.append('MoneyTransfer', serviceRights.MoneyTransfer);
    formData.append('AEPS', serviceRights.AEPS);
    formData.append('BillPayment', serviceRights.BillPayment);
    formData.append('MicroATM', serviceRights.MicroATM);
    formData.append('APITransfer', serviceRights.APITransfer);
    formData.append('Margin', serviceRights.Margin);
    formData.append('Debit', serviceRights.Debit);
    formData.append('Status', serviceRights.Status);

    // Flat fields outside nested groups
    formData.append('TxnPin', this.clientForm.get('TxnPin')?.value);
    formData.append('PlanId', this.clientForm.get('PlanId')?.value);
    formData.append('RegDate', new Date().toISOString().substring(0, 16));

    // Append files (from uploadedFiles object)
    ['PancopyFile', 'AadharFrontFile', 'AadharBackFile', 'LogoFile'].forEach(key => {
      const file = this.uploadedFiles[key];
      if (file instanceof File) {
        formData.append(key, file, file.name);
      }
    });

    this.http.post<any>('https://localhost:7003/api/Client/CreateOrUpdateClient', formData).subscribe({
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
    this.http.get<any>(`https://localhost:7003/api/Client/clientId?Id=${clientId}`).subscribe({
      next: (res) => {

        this.clientForm.get('companyInfo')?.patchValue({
          CompanyName: res.companyName,
          UserName: res.userName,
          EmailId: res.emailId,
          Phone: res.phone,
          Password: res.password,
          PanCard: res.panCard,
          AadharCard: res.aadharCard,
          DomainName: res.domainName
        });

        this.clientForm.get('addressInfo')?.patchValue({
          AddressLine1: res.addressLine1,
          AddressLine2: res.addressLine2,
          State: res.state,
          City: res.city,
          Pincode: res.pincode
        });

        this.clientForm.get('serviceRights')?.patchValue({
          Recharge: res.recharge,
          MoneyTransfer: res.moneyTransfer,
          AEPS: res.aeps,
          BillPayment: res.billPayment,
          MicroATM: res.microATM,
          APITransfer: res.apiTransfer,
          Margin: res.margin,
          Debit: res.debit,
          Status: res.status
        });

        this.clientForm.patchValue({
          TxnPin: res.txnPin,
          PlanId: res.planId
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


  ViewClient(clientId: number): void {
    this.isLoading = true;
    this.http.get<any>(`https://localhost:7003/api/Client/clientId?Id=${clientId}`).subscribe({
      next: (res) => {


        this.model = {
          CompanyName: res.companyName,
          UserName: res.userName,
          EmailId: res.emailId,
          Phone: res.phone,
          Password: res.password,
          PanCard: res.panCard,
          AadharCard: res.aadharCard,
          DomainName: res.domainName,

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

    this.http.post<any>('https://localhost:7003/api/Client/wallet-transaction', payload).subscribe({
      next: (response) => {
        if (response.isSuccessful) {
          this.toastr.success('Wallet transaction successful');
          this.walletTxn.userId = 0;
          this.walletTxn.actionById = 0;
          this.modalService.dismissAll();
          this.isLoading = false;
          this.walletTxn = {
            status: 'Credit',
            txnPin: '',
            amount: null,
            userId: 0,
            actionById: 0
          };
          this.loadClients(1, this.pageSize);
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

}


