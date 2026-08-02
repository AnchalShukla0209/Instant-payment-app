import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LoginPayload, OTPPayload } from '../../models/login-payload.model';
import { LoginResponse } from '../../models/login-response.model';
import { LoaderComponent } from '../app-loader/loader.component';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-forgetpassword',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, LoaderComponent],
  templateUrl: './forget-password.component.html'
})
export class ForgetPasswordComponent {
  token!: string;
  otp = '';
  newPassword = '';
  message = '';
  resendTimer = 30;
  canResend = false;
  isLoading = false;
  isPasswordValid= true;


  response: any = [];

  constructor(private authService: AuthService, private router: Router, private rout: ActivatedRoute, private toastr: ToastrService) { }

  ngOnInit() {
    this.token = this.rout.snapshot.queryParamMap.get('token')!;
     this.authService.ValidateResetPasswordLink({
      token: this.token,
      otp: this.otp,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.isPasswordValid= true;
        }
        else {
          this.isPasswordValid= false;
        }

      },
      error: err => {
        this.toastr.error(err?.error?.message ?? 'Something went wrong');
        this.isLoading = false;
      }
    });
    this.startTimer();
  }

  resetPassword() {
    if (!this.otp || !this.newPassword) {
      this.toastr.error('OTP and New Password are required');
      return;
    }
    this.isLoading = true;
    this.message = '';
    this.authService.resetPassword({
      token: this.token,
      otp: this.otp,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success(res.message);
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
          this.isLoading = false;
        }
        else {
          this.toastr.error(res.message);
          this.isLoading = false
          return;
        }

      },
      error: err => {
        this.toastr.error(err?.error?.message ?? 'Something went wrong');
        this.isLoading = false;
      }
    });
  }
  
  LoginRedirect()
  {
    this.router.navigate(['/login']);
  }

  resendOtp() {

    this.isLoading = true;
    this.authService.resendOtp(this.token).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toastr.success(res.message);
          this.startTimer();
          this.isLoading = false;
        }
        else {
          this.toastr.error(res.message);
          this.isLoading = false
          return;
        }
      },
      error: err => {
        this.toastr.error(err?.error?.message ?? 'Something went wrong');
        this.isLoading = false;
      }
    });
  }

  startTimer() {
    this.canResend = false;
    this.resendTimer = 30;

    const interval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer === 0) {
        this.canResend = true;
        clearInterval(interval);
      }
    }, 1000);
  }
}
