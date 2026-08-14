import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { LoaderComponent } from '../app-loader/loader.component';
import { PartnerShellComponent, PartnerShellMenu } from '../Partner-Shell/partner-shell.component';
import { PartnerAccountService } from '../../services/partner-account.service';
import { DistributorAuthService } from '../../services/distributor-auth.service';

export type PartnerPinMode = 'mpin' | 'txn';

@Component({
  selector: 'app-partner-change-pin',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbToastModule, LoaderComponent, PartnerShellComponent],
  templateUrl: './partner-change-pin.component.html',
  styleUrls: ['./partner-change-pin.component.scss']
})
export class PartnerChangePinComponent implements OnInit {
  @ViewChild('previewModal') previewModal: any;

  private readonly accountService = inject(PartnerAccountService);
  private readonly distributorAuth = inject(DistributorAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  pinMode: PartnerPinMode = 'mpin';
  activeMenu: PartnerShellMenu = 'change-mpin';

  name = '';
  phoneNo = '';
  panNo = '';
  aadharNo = '';
  inputPanNumber = '';
  inputAadhar = '';
  pinValue = '';
  otp = '';
  isLoading = false;
  showInputAadharError = false;
  showInputPanError = false;
  showPin = false;

  constructor(
    private readonly toastr: ToastrService,
    private readonly modalService: NgbModal
  ) {}

  get pageTitle(): string {
    return this.pinMode === 'mpin' ? 'CHANGE MPIN' : 'CHANGE TXN PIN';
  }

  get pinLabel(): string {
    return this.pinMode === 'mpin' ? 'MPIN' : 'Txn PIN';
  }

  get modalTitle(): string {
    return this.pinMode === 'mpin'
      ? 'Change MPIN - Instant Pay'
      : 'Change Txn PIN - Instant Pay';
  }

  ngOnInit(): void {
    this.pinMode = this.route.snapshot.data['pinMode'] === 'txn' ? 'txn' : 'mpin';
    this.activeMenu = this.pinMode === 'mpin' ? 'change-mpin' : 'change-txn-pin';

    const session = this.distributorAuth.getSession();
    if (!session) {
      this.toastr.error('Session expired. Please login.');
      void this.router.navigate(['/distributor-login']);
      return;
    }

    this.isLoading = true;
    this.accountService.getProfile().subscribe({
      next: profile => {
        this.name = profile.name || profile.username || session.displayName || session.username;
        this.phoneNo = profile.phone || '';
        this.panNo = profile.panCard || '';
        this.aadharNo = profile.aadharCard || '';
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.name = session.displayName || session.username;
        this.toastr.error('Unable to load profile details.');
      }
    });
  }

  validateUser(): void {
    if (!this.inputAadhar.trim() || !this.inputPanNumber.trim()) {
      this.toastr.error('Please Enter Aadhar Number And PAN Number!');
      this.showInputAadharError = true;
      this.showInputPanError = true;
      return;
    }

    if (this.inputAadhar.length !== 12) {
      this.toastr.error('Please Enter valid Aadhar Number!');
      this.showInputPanError = false;
      this.showInputAadharError = true;
      return;
    }

    if (this.inputPanNumber.length !== 10) {
      this.toastr.error('Please Enter valid PAN Number!');
      this.showInputAadharError = false;
      this.showInputPanError = true;
      return;
    }

    if (this.inputAadhar.trim() !== this.aadharNo.trim()) {
      this.toastr.error('Please Enter valid Aadhar Number!');
      this.showInputPanError = false;
      this.showInputAadharError = true;
      return;
    }

    if (this.inputPanNumber.trim().toUpperCase() !== this.panNo.trim().toUpperCase()) {
      this.toastr.error('Please Enter valid PAN Number!');
      this.showInputPanError = true;
      this.showInputAadharError = false;
      return;
    }

    this.isLoading = true;
    this.accountService.validateAndSendOtp(this.inputPanNumber.trim(), this.inputAadhar.trim()).subscribe({
      next: res => {
        this.isLoading = false;
        if (res.success) {
          this.toastr.success('User Validated Successfully, Please Enter OTP And Update PIN!');
          this.accountService.saveOtpFromResponse(res);
          this.inputAadhar = '';
          this.inputPanNumber = '';
          this.modalService.open(this.previewModal, { size: 'lg', backdrop: 'static', keyboard: false });
        } else {
          this.toastr.error(res.message);
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Something went wrong');
      }
    });
  }

  updatePin(): void {
    if (!this.pinValue) {
      this.toastr.error(`${this.pinLabel} is required`);
      return;
    }

    if (this.accountService.getStoredOtp() !== this.otp) {
      this.toastr.error('Please Enter Valid OTP!');
      return;
    }

    Swal.fire({
      title: 'Confirm Update',
      text: `Are you sure you want to update your ${this.pinLabel}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#5a2b91',
      cancelButtonColor: '#6c757d'
    }).then(result => {
      if (!result.isConfirmed) {
        return;
      }

      this.isLoading = true;
      const request$ =
        this.pinMode === 'mpin'
          ? this.accountService.changeMpin({ mpin: this.pinValue, otp: this.otp })
          : this.accountService.changeTxnPin({ txnPin: this.pinValue, otp: this.otp });

      request$.subscribe({
        next: res => {
          this.isLoading = false;
          if (res.success) {
            this.toastr.success(res.message);
            this.pinValue = '';
            this.otp = '';
            this.inputAadhar = '';
            this.inputPanNumber = '';
            this.accountService.clearStoredOtp();
            this.modalService.dismissAll();
          } else {
            this.toastr.error(res.message);
          }
        },
        error: () => {
          this.isLoading = false;
          this.toastr.error('Something went wrong');
        }
      });
    });
  }

  resendOtp(): void {
    this.accountService.resendOtp().subscribe({
      next: res => {
        if (res.success) {
          this.toastr.success('OTP Sent Successfully!');
        } else {
          this.toastr.error(res.message || 'Failed to resend OTP');
        }
      },
      error: () => this.toastr.error('Failed to resend OTP')
    });
  }

  cancel(): void {
    this.otp = '';
    this.modalService.dismissAll();
  }
}
