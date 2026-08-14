import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PartnerPaymentService } from '../../services/partner-payment.service';
import { BankDto } from '../../models/BankDto';
import { PaymentRequestDto } from '../../models/payment-request.model';
import { PartnerShellComponent } from '../Partner-Shell/partner-shell.component';

/**
 * Distributor / Master Distributor self-service wallet top-up form - the same "raise a
 * request against a company bank account" flow retailers get on `/Payment-Request`, wrapped
 * in the shared partner shell and scoped server-side to the logged-in partner (see
 * `PartnerPaymentController`). Reused for both `/distributor/payment-request` and
 * `/master-distributor/payment-request`.
 */
@Component({
  selector: 'app-partner-payment-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbToastModule, PartnerShellComponent],
  templateUrl: './partner-payment-request.component.html',
  styleUrls: ['./partner-payment-request.component.scss']
})
export class PartnerPaymentRequestComponent implements OnInit {
  @ViewChild('txnFileInput') txnFileInput!: ElementRef<HTMLInputElement>;

  paymentForm!: FormGroup;
  banks: BankDto[] = [];
  bankSelected = false;
  bankDetails: BankDto | null = null;
  isLoading = false;
  txnSlipFile: File | null = null;

  depositModes = [
    { value: 'CASH', label: 'Cash Deposit' },
    { value: 'NEFT', label: 'NEFT' },
    { value: 'RTGS', label: 'RTGS' },
    { value: 'IMPS', label: 'IMPS' }
  ];

  constructor(
    private readonly paymentService: PartnerPaymentService,
    private readonly toastr: ToastrService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBanks();
  }

  private initForm(): void {
    this.paymentForm = this.fb.group({
      bankId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      txnId: ['', Validators.required],
      depositMode: ['', Validators.required],
      txnSlip: [null, Validators.required],
      userRemarks: ['', Validators.required]
    });

    this.paymentForm.get('bankId')?.valueChanges.subscribe(id => {
      if (id) {
        this.bankSelected = true;
        this.paymentService.getBankById(id).subscribe({
          next: res => (this.bankDetails = res),
          error: () => {
            this.toastr.error('Failed to load bank details');
            this.bankDetails = null;
          }
        });
      } else {
        this.bankSelected = false;
        this.bankDetails = null;
      }
    });
  }

  private loadBanks(): void {
    this.isLoading = true;
    this.paymentService.getActiveBanks().subscribe({
      next: res => {
        this.banks = res;
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load banks');
        this.isLoading = false;
      }
    });
  }

  onFileChange(event: any): void {
    const input = event.target as HTMLInputElement;
    const file = event.target.files[0];
    const ext = file?.name?.split('.').pop()?.toLowerCase();
    if ((ext === 'jpg' || ext === 'jpeg' || ext === 'png') && input.files && input.files.length > 0) {
      this.txnSlipFile = input.files[0];
      this.paymentForm.patchValue({ txnSlip: this.txnSlipFile });
    } else {
      Swal.fire('Validation', 'Only JPG and PNG files are allowed', 'warning');
      this.paymentForm.patchValue({ txnSlip: null });
      this.txnSlipFile = null;
      event.target.value = '';
    }
  }

  onSubmit(): void {
    if (this.paymentForm.invalid) {
      this.toastr.error('Please fill all required fields');
      return;
    }

    const request: PaymentRequestDto = {
      bankId: this.paymentForm.value.bankId,
      userId: 0, // ignored server-side - the request is always raised for the logged-in partner
      amount: this.paymentForm.value.amount,
      paymentTxnId: this.paymentForm.value.txnId,
      deposideMode: this.paymentForm.value.depositMode,
      txnSlip: this.txnSlipFile,
      userRemarks: this.paymentForm.value.userRemarks
    };

    this.paymentService.create(request).subscribe({
      next: () => {
        Swal.fire('Success', 'Payment request submitted successfully', 'success');
        this.onReset();
      },
      error: err => {
        Swal.fire('Error', err.error?.message || err.error?.Message || 'Failed to submit request', 'error');
      }
    });
  }

  onReset(): void {
    this.paymentForm.reset({
      bankId: '',
      amount: '',
      txnId: '',
      depositMode: '',
      txnSlip: null,
      userRemarks: ''
    });

    if (this.txnFileInput) {
      this.txnFileInput.nativeElement.value = '';
    }

    this.bankSelected = false;
    this.bankDetails = null;
    this.txnSlipFile = null;
    this.loadBanks();
  }
}
