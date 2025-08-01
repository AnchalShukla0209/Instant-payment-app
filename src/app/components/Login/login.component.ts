import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LoginPayload, OTPPayload } from '../../models/login-payload.model';
import { LoaderComponent } from '../app-loader/loader.component';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, LoaderComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  inputotp = '';
  isLoading = false;
  usertype = '';
  isotprequired = false;
  isInputLogin = true;
  userotp = '';

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService) { }

  verifyOTP(): void {
    this.isLoading = true;

    this.userotp = this.authService.getUserOTP()
    const enteredOtp = this.inputotp;
    if (!enteredOtp) {
      this.isLoading = false;
      this.toastr.error('Please enter OTP');
      return;
    }
    if (enteredOtp === this.userotp) {
      this.usertype = this.authService.getUsertype();
      const payload2: OTPPayload = {
        usertype: this.usertype,
        userid: String(this.authService.getUserId())
      };

      this.authService.MatchOTP(payload2).subscribe({
        next: (res) => {
          debugger
          if (res.success) {
            this.toastr.success('OTP Verified Successfully');
            this.isLoading = false;
            if ( this.usertype == 'Retailer') {
              this.router.navigate(['/dashboard']);
            }
            else if ( this.usertype == 'SuperAdmin') {
              this.router.navigate(['/dashboard.superadmin']);
            }
            else {
              this.router.navigate(['/unauthorized']);
            }
          }
          else
          {
            this.toastr.error(res.message)
          }


        },
        error: () => {
          this.toastr.error('Invalid login');
          this.isLoading = false;
        }
      });

      

    }
    else {
      this.isLoading = false;
      this.toastr.error('Invalid OTP');
      return;
    }

  }

  resendotp(): void {
    this.isLoading = true;
    const payload3: OTPPayload = {
      usertype: this.usertype,
      userid: String(this.authService.getUserId())
    };

    this.authService.ResendOTP(payload3).subscribe({
        next: (res) => {
          debugger
          this.isLoading = false;
          this.toastr.success(res.messaege);
        },
        error: () => {
          this.toastr.error('Invalid API Call, resend OTP failed');
          this.isLoading = false;
        }
      });
  }

  onSubmit(): void {
    this.isLoading = true;
    const payload: LoginPayload = {
      username: this.username,
      password: this.password
    };

    this.authService.login(payload).subscribe({
      next: (res) => {
        debugger
        this.authService.saveLoginData(res);
        
        this.usertype = this.authService.getUsertype();
        this.isotprequired = this.authService.getIsOtpRequired();
        if(!this.isotprequired)
        {
        if (this.isotprequired == false && this.usertype == 'Retailer') {
          this.router.navigate(['/dashboard']);
        }
        else if (this.isotprequired == false && this.usertype == 'SuperAdmin') {
          this.router.navigate(['/dashboard.superadmin']);
        }
        else {
          this.router.navigate(['/unauthorized']);
        }
      }
      else
      {
        this.isLoading=false;
        this.toastr.success('Login Details Verified, Please Enter OTP')
        
      }

      },
      error: () => {
        this.toastr.error('Invalid login');
        this.isLoading = false;
      }
    });
  }

}
