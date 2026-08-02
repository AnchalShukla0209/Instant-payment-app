import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import html2pdf from 'html2pdf.js';
import { LoaderComponent } from '../app-loader/loader.component';
import { MoneyTransferService } from '../../services/money-transfer.service';
import { AuthService } from '../../services/auth.service';
import { SettlementService } from '../../services/settlement.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-Settlement',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, NgbToastModule, LoaderComponent, NgSelectModule],
  templateUrl: './Settlement.component.html',
  styleUrls: ['./Settlement.component.scss']
})
export class SettlementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalService = inject(NgbModal);
  private toastr = inject(ToastrService);
  private moneyTransferService = inject(MoneyTransferService);
  private authServiceobj = inject(AuthService);
  private settlementService = inject(SettlementService);
  private router = inject(Router);

  @ViewChild('invoiceModal') invoiceModal: any;

  isLoading = false;
  userId: string = '';
  userName: string = '';
  invoiceData: any = null;

  // Settlement Data
  settlementData: any = null;
  totalAEPSAmount: number = 0;
  totalRazorpayAmount: number = 0;
  totalMATMAmount: number = 0;
  availableAEPSAmount: number = 0;
  availableRazorpayAmount: number = 0;
  availableMATMAmount: number = 0;
  aepsWithdrawnAmount: number = 0;
  razorpayWithdrawnAmount: number = 0;
  matmWithdrawnAmount: number = 0;
  settlementFromDate: string = '';
  settlementToDate: string = '';

  // Bank List
  banks: any[] = [];

  // Withdrawal Form
  withdrawalForm!: FormGroup;
  selectedWithdrawalType: string = 'AEPS';
  validatebankdetails: boolean = false;
  currentBankName: string = '';

  constructor() {
    this.withdrawalForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1), Validators.max(100000)]],
      withdrawalType: ['AEPS', Validators.required],
      bankName: ['', Validators.required],
      bankAccount: ['', [Validators.required, Validators.pattern('^[0-9]{9,18}$')]],
      ifsc: ['', [Validators.required, Validators.pattern('^[A-Za-z]{4}0[A-Za-z0-9]{6}$')]],
      beneName: ['', Validators.required],
      latitude: [''],
      longitude: ['']
    });
  }

  ngOnInit() {
    this.userId = this.authServiceobj.getUserId();
    this.userName = this.authServiceobj.getUsername();

    if (!this.userId || !this.userName) {
      Swal.fire('Validation', 'Session expired. Please login.', 'warning');
      this.router.navigate(['/login']);
      return;
    }

    this.loadSettlementData();
    this.loadBanks();
  }

  loadSettlementData() {
    this.isLoading = true;
    this.settlementService.getSettlementData(this.userId).subscribe({
      next: (res) => {
        this.settlementData = res;
        this.totalAEPSAmount = res.totalAEPSAmount || 0;
        this.totalRazorpayAmount = res.totalRazorpayAmount || 0;
        this.totalMATMAmount = res.totalMATMAmount || 0;
        this.availableAEPSAmount = res.availableAEPSAmount || 0;
        this.availableRazorpayAmount = res.availableRazorpayAmount || 0;
        this.availableMATMAmount = res.availableMATMAmount || 0;
        this.aepsWithdrawnAmount = res.aepsWithdrawnAmount || 0;
        this.razorpayWithdrawnAmount = res.razorpayWithdrawnAmount || 0;
        this.matmWithdrawnAmount = res.matmWithdrawnAmount || 0;
        this.settlementFromDate = res.settlementFromDate || '';
        this.settlementToDate = res.settlementToDate || '';
        this.isLoading = false;
      },
      error: (err) => {
        this.toastr.error('Failed to load settlement data');
        this.isLoading = false;
      }
    });
  }

  loadBanks() {
    const payload = {
      SessionKey: this.authServiceobj.getSessionKey(),
      APIKey: "GetBank001"
    };
    this.moneyTransferService.getBankList(payload).subscribe({
      next: (res: any) => {
        if (res.Status_Code === "1") {
          this.banks = res.Data;
        }
      },
      error: (err) => {
        this.toastr.error('Failed to load bank list');
      }
    });
  }

  onBankSelect(bank: any) {
    this.currentBankName = bank.Bankname;
    this.withdrawalForm.patchValue({
      bankName: bank.Bankname,
      ifsc: bank.Ifsc
    });
  }

  getBankName(bankId: any): string {
    const bank = this.banks.find(b => b.BankId === bankId);
    return bank ? bank.Bankname : '';
  }

  ValidateBankDetails() {
    const form = this.withdrawalForm.value;

    if (!form.bankAccount || !form.ifsc || !form.beneName || !form.bankName) {
      this.toastr.error('Please fill all bank details before verifying');
      return;
    }

    this.isLoading = true;

    const payload = {
      SessionKey: this.authServiceobj.getSessionKey(),
      APIKey: "AccountVarify001",
      SenderMobile: this.authServiceobj.getUserPhoneNo(),
      BeneName: form.beneName.toString(),
      AccountNo: form.bankAccount.toString(),
      IfscCode: form.ifsc.toString(),
      BankName: form.bankName.toString()
    };

    this.moneyTransferService.verifyAccount(payload).subscribe({
      next: (res: any) => {
        if (res.Status_Code === "1") {
          const beneName = res.Data[0].BeneName;
          this.withdrawalForm.patchValue({ beneName: beneName });
          this.validatebankdetails = true;
          this.toastr.success('✅ Account Verified Successfully');
        } else {
          this.toastr.error('❌ ' + res.Message);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toastr.error('Bank verification failed');
        this.isLoading = false;
      }
    });
  }

  onWithdrawalTypeChange(type: string) {
    this.selectedWithdrawalType = type;
    this.withdrawalForm.patchValue({ withdrawalType: type });
  }

  async processWithdrawal() {
    this.isLoading = true;

    if (this.withdrawalForm.invalid) {
      this.showValidationMessages();
      this.isLoading = false;
      return;
    }

    const amount = this.withdrawalForm.get('amount')?.value;
    const withdrawalType = this.withdrawalForm.get('withdrawalType')?.value;

    // Validate amount against available balance
    if (withdrawalType === 'AEPS' && amount > this.availableAEPSAmount) {
      this.toastr.error(`Amount cannot exceed available AEPS balance: ₹${this.availableAEPSAmount}`);
      this.isLoading = false;
      return;
    }

    if (withdrawalType === 'Razorpay' && amount > this.availableRazorpayAmount) {
      this.toastr.error(`Amount cannot exceed available Razorpay balance: ₹${this.availableRazorpayAmount}`);
      this.isLoading = false;
      return;
    }

    if (withdrawalType === 'MATM' && amount > this.availableMATMAmount) {
      this.toastr.error(`Amount cannot exceed available MATM balance: ₹${this.availableMATMAmount}`);
      this.isLoading = false;
      return;
    }

    // Get location
    const { latitude, longitude } = await this.settlementService.getLocation();
    this.withdrawalForm.patchValue({ latitude, longitude });

    const payload = {
      userId: this.userId.toString(),
      amount: amount,
      withdrawalType: withdrawalType,
      bankName: this.withdrawalForm.get('bankName')?.value,
      bankAccount: this.withdrawalForm.get('bankAccount')?.value,
      ifsc: this.withdrawalForm.get('ifsc')?.value,
      beneName: this.withdrawalForm.get('beneName')?.value,
      beneEmail: this.withdrawalForm.get('beneEmail')?.value || '',
      benePhone: this.withdrawalForm.get('benePhone')?.value || '',
      beneAddress: this.withdrawalForm.get('beneAddress')?.value || '',
      latitude: latitude,
      longitude: longitude,
      comingFrom: 'web'
    };

    this.isLoading = true;
    this.settlementService.withdraw(payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success(res.message || 'Withdrawal successful');
          this.invoiceData = {
            BeneName: payload.beneName,
            BankName: payload.bankName,
            AccountNo: payload.bankAccount,
            IFSCCode: payload.ifsc,
            Amount: amount,
            WithdrawalType: withdrawalType,
            Charge: res.charge || 0,
            RemainingAmount: res.remainingAmount || 0,
            NewWalletBalance: res.newWalletBalance || 0,
            PayoutTransactionId: res.payoutTransactionId,
            PayoutStatus: res.payoutStatus || 'PENDING',
            TxnDate: new Date().toLocaleString('en-IN'),
            UserId: this.userId.toString(),
            UserName: this.userName
          };
          this.modalService.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false });
          this.withdrawalForm.reset();
          this.validatebankdetails = false;
          this.loadSettlementData(); // Refresh balances
        } else {
          this.toastr.error(res.message || 'Withdrawal failed');
        }
        this.isLoading = false;
      },
      error: (err) => {
        if (err.error && err.error.message) {
          this.toastr.error(err.error.message);
        } else {
          this.toastr.error('Withdrawal failed. Please try again.');
        }
        this.isLoading = false;
      }
    });
  }

  private showValidationMessages() {
    const messages: string[] = [];
    const form = this.withdrawalForm;

    if (form.get('amount')?.invalid) {
      if (form.get('amount')?.errors?.['required']) {
        messages.push('• Amount is required.');
      }
      if (form.get('amount')?.errors?.['min']) {
        messages.push('• Amount must be greater than 0.');
      }
      if (form.get('amount')?.errors?.['max']) {
        messages.push('• Amount cannot exceed ₹1,00,000.');
      }
    }

    if (form.get('bankName')?.invalid) {
      messages.push('• Bank Name is required.');
    }

    if (form.get('bankAccount')?.invalid) {
      if (form.get('bankAccount')?.errors?.['required']) {
        messages.push('• Account Number is required.');
      }
      if (form.get('bankAccount')?.errors?.['pattern']) {
        messages.push('• Account Number must be 9-18 digits.');
      }
    }

    if (form.get('ifsc')?.invalid) {
      if (form.get('ifsc')?.errors?.['required']) {
        messages.push('• IFSC Code is required.');
      }
      if (form.get('ifsc')?.errors?.['pattern']) {
        messages.push('• IFSC Code format is invalid (e.g., SBIN0001234).');
      }
    }

    if (form.get('beneName')?.invalid) {
      messages.push('• Beneficiary Name is required.');
    }

    if (messages.length) {
      this.toastr.error(messages.join('<br>'), 'Validation Message', { enableHtml: true });
    }
  }

  onBankAccountBlur() {
    this.checkAndVerifyBank();
  }

  onIfscBlur() {
    this.checkAndVerifyBank();
  }

  private checkAndVerifyBank() {
    const account = this.withdrawalForm.get('bankAccount')?.value;
    const ifsc = this.withdrawalForm.get('ifsc')?.value;
    const beneName = this.withdrawalForm.get('beneName')?.value;
    const bankName = this.withdrawalForm.get('bankName')?.value;

    if (account && ifsc && beneName && bankName && this.withdrawalForm.get('bankAccount')?.valid && this.withdrawalForm.get('ifsc')?.valid) {
      this.ValidateBankDetails();
    }
  }

  onCancel() {
    this.withdrawalForm.reset();
    this.validatebankdetails = false;
  }

  validateAmountKeydown(event: KeyboardEvent) {
    const key = event.key;
    const currentValue = this.withdrawalForm.get('amount')?.value?.toString() || '';

    // Allow navigation keys
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }

    // Allow only digits and decimal point
    if (!/^[0-9.]$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Prevent multiple decimal points
    if (key === '.' && currentValue.includes('.')) {
      event.preventDefault();
      return;
    }

    // Calculate the new value after this keypress
    const newValue = currentValue + key;
    const numValue = parseFloat(newValue);

    // Prevent if it would exceed 100000
    if (!isNaN(numValue) && numValue > 100000) {
      event.preventDefault();
      return;
    }
  }

  validateAmountInput() {
    const currentValue = this.withdrawalForm.get('amount')?.value;

    if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
      const numValue = parseFloat(currentValue.toString());
      if (numValue > 100000) {
        // Truncate to 100000 if somehow it got through
        this.withdrawalForm.patchValue({ amount: 100000 }, { emitEvent: false });
      }
    }
  }

  validateAmountPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const numericValue = parseFloat(pastedText);

    if (!isNaN(numericValue) && numericValue <= 100000 && numericValue >= 1) {
      this.withdrawalForm.patchValue({ amount: numericValue });
    }
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
      filename: 'Settlement_Invoice.pdf',
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
