import { Component, ViewChild, inject, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbToastModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import html2pdf from 'html2pdf.js';
import { LoaderComponent } from '../app-loader/loader.component';
import { OperatorService } from '../../services/operator.service';
import { RechargeRequest } from '../../models/recharge.model';
import { RechargeService } from '../../services/recharge.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MasterService, ServiceStatusResponse } from '../../services/master.service';
import { RechargePlan, RechargePlanResponse } from '../../../app/models/RechargePlan'
import Swal from 'sweetalert2'

@Component({
  selector: 'app-recharge',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbToastModule, LoaderComponent],
  templateUrl: './recharge.component.html',
  styleUrls: ['./recharge.component.scss']
})
export class RechargeComponent {
  private rechargeService = inject(RechargeService);
  private authServiceobj = inject(AuthService);
  private router = inject(Router);
  private modalService = inject(NgbModal);
  private toastr = inject(ToastrService);
  private operatorService = inject(OperatorService);
  private masterService = inject(MasterService);

  selectedService: 'PREPAID' | 'DTH' = 'PREPAID';
  isMobilePlanVisible = false;
  showMobilePlans = false;
  showDthPlans = false;
  showPinError = false;

  mobileNumber = '';
  mobileAmount = '';
  txnPin = '';
  dthNumber = '';
  dthOperator = '';
  dthAmount = '';
  dthTxnPin = '';
  isLoading = false;
  isLoadingPlans = false;
  toastMessages: string[] = [];
  showMobileError = false;
  showOperatorError = false;
  showAmountError = false;
  selectedPlanAmount: number | null = null;
  planSearchText: string = '';

  operatorList: any[] = [];
  mobileOperator: { label: string; value: string } | null = null;

  rechargeStatus = '';
  txnid = '';
  brid = '';
  transactiondatetime = '';
  userName = '';

  mobilePlans: RechargePlan[] = [];

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

  ngOnInit() {
    this.loadOperatorsList();
  }

  CheckServiceStatus(userId: number, serviceName: string): void {
    this.isLoading = false;
    this.masterService.checkServiceStatus("Mobile Recharge", userId).subscribe({
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
            text: "Mobile Recharge is down or not active. Please contact to admin",
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
    this.mobilePlans = [];
    this.loadOperatorsList();
  }

  selectedTab() {
    return this.selectedService;
  }

  loadOperatorsList() {
    this.isLoading = true;
    this.operatorService.getOperators(this.selectedTab()).subscribe({
      next: (res) => {
        this.operatorList = res.map((op: any) => ({
          label: op.OperatorName,
          value: op.Spkey
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load operators', err);
        this.operatorList = [];
        this.isLoading = false;
      }
    });
  }

  loadDTHPlans() {
    if (this.dthNumber.trim().length >= 6 && this.dthOperator) {
      this.showDthPlans = true;
    } else {
      this.showDthPlans = false;
    }
  }

  selectPlan(type: 'PREPAID' | 'DTH', amount: number) {
    if (type === 'PREPAID') this.mobileAmount = String(amount);
    if (type === 'DTH') this.dthAmount = String(amount);
    this.selectedPlanAmount = amount;
    if (this.selectedPlanAmount && !this.filteredMobilePlans.some(p => p.rs === this.selectedPlanAmount)) {
      this.selectedPlanAmount = null;
    }
  }

  get filteredMobilePlans() {
    if (!this.planSearchText?.trim()) {
      return this.mobilePlans;
    }
    const search = this.planSearchText.toLowerCase();
    return this.mobilePlans.filter(plan =>
      plan.rs.toString().includes(search) ||
      plan.desc.toLowerCase().includes(search)
    );
  }


  loadMobilePlans() {
    this.isLoading = true;
    if (this.mobileNumber.trim().length >= 10 && this.mobileOperator) {
      let operatorName = this.mobileOperator.label.split('-')[0];

      if (operatorName === 'VI') {
        operatorName = 'Vodafone';
      } else {
        operatorName =
          operatorName.charAt(0) + operatorName.slice(1).toLowerCase();
      }

      const payload = {
        tel: this.mobileNumber,
        offer: 'roffer',
        operatorName: operatorName
      };
      this.isLoadingPlans = true;
      this.masterService.PlanForMobile(payload).subscribe({
        next: (res) => {
          if (res?.code === 200) {
            this.mobilePlans = res.data.data.records;
            if (res.data.data.records == undefined) {
              this.mobilePlans = [];
              this.showMobilePlans = false;
              this.isMobilePlanVisible = false;
              this.isLoading = false;
            }
            else {
              this.showMobilePlans = true;
              this.isMobilePlanVisible = true;
              this.isLoading = false;
            }
          } else {
            this.mobilePlans = [];
            this.isLoading = false;
          }
          this.isLoadingPlans = false;
          this.isLoading = false;
        },
        error: () => {
          this.mobilePlans = [];
          this.isLoadingPlans = false;
          this.isLoading = false;
        }
      });
    } else {
      this.showMobilePlans = false;
      this.isLoading = false;
      this.isMobilePlanVisible = false;
    }
  }

  getMobileFieldClass(): string {
    return this.showMobilePlans ? 'form-group' : 'col-md-4';
  }

  getRechargeFieldClass(): string {
    return this.showMobilePlans ? 'form-group col-md-6' : 'col-md-12';
  }

  onSelect() {
    this.validateOperator();
  }

  validateMobileNumber() {
    const isDTH = this.selectedTab() === 'DTH';
    const trimmed = this.mobileNumber?.trim() || '';

    if (isDTH) {
      this.showMobileError = trimmed.length < 6;
    } else {
      this.showMobileError = trimmed.length !== 10 || !/^\d+$/.test(trimmed);
    }
  }

  validateOperator() {
    this.showOperatorError = !(this.mobileOperator && this.mobileOperator.value);
    if (this.selectedTab() === 'PREPAID') {
      this.loadMobilePlans();
    }
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

  openPreviewModal(modalContent: any) {
    this.isLoading = true;
    this.validateMobileNumber();
    this.validateOperator();
    this.validateAmount();

    if (this.showMobileError || this.showOperatorError || this.showAmountError) {
      this.showToastsFromErrors();
      this.isLoading = false;
      return;
    }

    this.isLoading = false;
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
      CustomerRefNo: this.generateCustomerRefNo(),
      optional: ""
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
          this.rechargeStatus = 'SUCCESS';
        } else if (
          (res.success == false && res.message === 'Invalid Transaction PIN') ||
          (res.success == false && res.message === 'Invalid User') ||
          (res.success == false && res.message === 'Invalid Operator') ||
          (res.success == false && res.message === 'Insufficient balance in wallet. Please add funds.')
        ) {
          this.toastr.error(res.message);
          return;
        } else {
          this.toastr.error(res.message || 'Recharge failed');
          return;
        }

        const modalRef = this.modalService.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false });

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

  isNumberKey(event: KeyboardEvent): boolean {
    const charCode = event.charCode ? event.charCode : event.keyCode;
    return charCode >= 48 && charCode <= 57;
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
      filename: 'Recharge_Invoice.pdf',
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


