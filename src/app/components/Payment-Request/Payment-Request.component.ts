import { Component, OnInit, inject,ViewChild, ElementRef} from '@angular/core';
import { CommonModule, } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators,  } from '@angular/forms';
import { NgbToastModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { BankService } from '../../services/bank.service';
import { PaymentService } from '../../services/payment.service';
import { BankDto } from '../../models/BankDto';
import { PaymentRequestDto } from '../../models/payment-request.model';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-payment-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbToastModule],
  templateUrl: './Payment-Request.component.html',
  styleUrls: ['./Payment-Request.component.scss']
})
export class PaymentRequestComponent implements OnInit {
  constructor(
    private bankService: BankService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private paymentService: PaymentService
  ) { }

  txnSlipFile: File | null = null;
  @ViewChild('txnFileInput') txnFileInput!: ElementRef<HTMLInputElement>;
  paymentForm!: FormGroup;
  banks: BankDto[] = [];
  bankSelected = false;
  bankDetails: BankDto | null = null;
  isLoading = false;
  PaymentRequestDtoRequest: PaymentRequestDto | null = null;
  depositModes = [
    { value: 'CASH', label: 'Cash Deposit' },
    { value: 'NEFT', label: 'NEFT' },
    { value: 'RTGS', label: 'RTGS' },
    { value: 'IMPS', label: 'IMPS' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadBanks();
  }

  private initForm() {
    this.paymentForm = this.fb.group({
      bankId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      txnId: ['', Validators.required],
      depositMode: ['', Validators.required],
      txnSlip: [null, Validators.required],
      userRemarks: ['', Validators.required]
    });

    // When bank changes, set bank details
    this.paymentForm.get('bankId')?.valueChanges.subscribe((id) => {
      if (id) {
        this.bankSelected = true;
        this.bankService.getById(id).subscribe({
          next: (res) => {
            this.bankDetails = res;
          },
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

  private loadBanks() {
    this.isLoading = true;
    this.bankService.getAllActive().subscribe({
      next: (res) => {
        this.banks = res;
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load banks');
        this.isLoading = false;
      }
    });
  }

  onFileChange(event: any) {
    const input = event.target as HTMLInputElement;
    const file = event.target.files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if ((ext === 'jpg' || ext === 'jpeg' || ext === 'png') && (input.files && input.files.length > 0)) {
      this.txnSlipFile = input.files[0];
      this.paymentForm.patchValue({ txnSlip: this.txnSlipFile });
    }
    else {
      Swal.fire('Validation', 'Only JPG and PNG files are allowed', 'warning');
      this.paymentForm.patchValue({ txnSlip: null });
      this.txnSlipFile = null;
      event.target.value = '';
    }
  }

  onSubmit() {
    if (this.paymentForm.invalid) {
      this.toastr.error('Please fill all required fields');
      return;
    }


    this.PaymentRequestDtoRequest = {
      bankId: this.paymentForm.value.bankId,
      userId: 0,
      amount: this.paymentForm.value.amount,
      paymentTxnId: this.paymentForm.value.txnId,
      deposideMode: this.paymentForm.value.depositMode,
      txnSlip: this.txnSlipFile,
      userRemarks: this.paymentForm.value.userRemarks
    };
    console.log('✅ Submitting payment request:', this.PaymentRequestDtoRequest);
    this.paymentService.create(this.PaymentRequestDtoRequest).subscribe({
      next: (id) => {
        Swal.fire('Success', 'Payment request submitted successfully', 'success');
        console.log('PaymentId returned:', id);

        this.txnSlipFile = null;
        this.onReset();
        this.bankSelected = false;
        this.bankDetails = null;
        this.txnSlipFile = null;

      },
      error: (err) => {
        Swal.fire('Error', err.error?.message || 'Failed to submit request', 'error');

      }
    });

    //Swal.fire('Success', 'Payment request submitted successfully', 'success');
    // this.paymentForm.reset();
    // this.bankSelected = false;
    // this.bankDetails = null;
    // this.txnSlipFile = null;
  }

  onReset() {
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
