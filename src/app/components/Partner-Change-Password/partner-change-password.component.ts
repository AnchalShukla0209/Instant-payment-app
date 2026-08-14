import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { LoaderComponent } from '../app-loader/loader.component';
import { PartnerShellComponent } from '../Partner-Shell/partner-shell.component';
import { PartnerAccountService } from '../../services/partner-account.service';
import { DistributorAuthService } from '../../services/distributor-auth.service';

@Component({
  selector: 'app-partner-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbToastModule, LoaderComponent, PartnerShellComponent],
  templateUrl: './partner-change-password.component.html',
  styleUrls: ['./partner-change-password.component.scss']
})
export class PartnerChangePasswordComponent implements OnInit {
  @ViewChild('previewModal') previewModal: any;

  private readonly accountService = inject(PartnerAccountService);
  private readonly distributorAuth = inject(DistributorAuthService);
  private readonly router = inject(Router);

  name = '';
  phoneNo = '';
  panNo = '';
  aadharNo = '';
  inputPanNumber = '';
  inputAadhar = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  otp = '';
  isLoading = false;
  showInputAadharError = false;
  showInputPanError = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private readonly toastr: ToastrService,
    private readonly modalService: NgbModal
  ) {}

  ngOnInit(): void {
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
          this.toastr.success('User Validated Successfully, Please Enter OTP And Change Password!');
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

  updatePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.toastr.error('All fields are required');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastr.error('New Password & Confirm Password must match');
      return;
    }

    if (!this.isPasswordValid(this.newPassword)) {
      this.toastr.error('Password must contain uppercase, lowercase, number & special character');
      return;
    }

    if (this.accountService.getStoredOtp() !== this.otp) {
      this.toastr.error('Please Enter Valid OTP!');
      return;
    }

    Swal.fire({
      title: 'Confirm Password Change',
      text: 'Are you sure you want to change your password?',
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
      this.accountService.changePassword({
        oldPassword: this.currentPassword,
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
        otp: this.otp
      }).subscribe({
        next: res => {
          this.isLoading = false;
          if (res.success) {
            this.toastr.success(res.message);
            this.resetForm();
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

  isPasswordValid(password: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{};':"\\|,.<>\/]).{8,}$/;
    return regex.test(password);
  }

  private resetForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.otp = '';
    this.inputAadhar = '';
    this.inputPanNumber = '';
  }
}
