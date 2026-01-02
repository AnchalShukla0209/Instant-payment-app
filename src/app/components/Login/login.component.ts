import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { LoginPayload, OTPPayload } from '../../models/login-payload.model';
import { LoginResponse } from '../../models/login-response.model';
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
  latitude: string = "";
  longitude: string = "";

  response: any = [];

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService) { }

  verifyOTP(): void {
    this.isLoading = true;

    const d = this.response?.Data?.[0] || {};

    this.userotp = this.authService.getUserOTP()
    const enteredOtp = this.inputotp;
    if (!enteredOtp) {
      this.isLoading = false;
      this.toastr.error('Please enter OTP');
      return;
    }
    if (enteredOtp == this.userotp) {
      this.usertype = this.authService.getUsertype();
      const payload2: OTPPayload = {
        usertype: this.usertype,
        userid: String(d?.Id ?? this.authService.getUserId())
      };

      this.authService.MatchOTP(payload2).subscribe({
        next: (res) => {
          debugger
          if (res.success) {
            this.toastr.success('OTP Verified Successfully');
            this.authService.saveLoginData(this.response);
            this.isLoading = false;
            if (this.usertype == 'RT' || this.usertype == 'Retailer') {
              this.router.navigate(['/dashboard']);
            }
            else if (this.usertype == 'SuperAdmin') {
              this.router.navigate(['/dashboard.superadmin']);
            }
            else {
              this.router.navigate(['/unauthorized']);
            }
          }
          else {
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
    const sessionKey = this.authService.getSessionKey();
    this.authService.sendLoginOTP(sessionKey).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastr.success('OTP Sent Successfully');
        this.isotprequired = true;
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Failed to send OTP');
      }
    });
  }

  ngOnInit() {
    this.isLoading = true;
    this.getLocation();
    this.isLoading = false;

  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = "28.6201416" //position.coords.latitude.toString();
          this.longitude = "76.9879671" //position.coords.longitude.toString();

          console.log("Latitude:", this.latitude);
          console.log("Longitude:", this.longitude);
        },
        (error) => {
          console.warn("GPS Permission Denied or Unavailable", error);

          // Fallback
          this.latitude = "0.0";
          this.longitude = "0.0";
        }
      );
    } else {
      console.warn("Geolocation is not supported");
      this.latitude = "0.0";
      this.longitude = "0.0";
    }
  }


  onSubmit(): void {
    this.isLoading = true;

    if (this.username != 'admin') {
      const payload: LoginPayload = {
        UserName: this.username,
        Password: this.password,
        lat: this.latitude,
        long: this.longitude,
        ApiKey: "Login001",
        DeviceID: "aaa",
        TokenKey: "aaa",
        DeviceInfo: "aaa"
      };

      this.authService.login(payload).subscribe({
        next: (res: any) => {
          debugger;
          if (res.Message === 'Login Failed.') {
            this.toastr.error(res.Data);
            this.isLoading = false;
            return;
          }
          res.Data[0].Usertype = res?.Data[0]?.Usertype == 'RT' ? 'Retailer' : res?.Data[0]?.Usertype;
          this.response = res;
          const otpStatus = res.OTPStatus;
          const sessionKey = res.SessionKey;
          const userType = res.Data?.[0]?.Usertype;
          if (otpStatus === "YES") {

            this.authService.sendLoginOTP(sessionKey).subscribe({
              next: (otp) => {
                this.isLoading = false;
                this.toastr.success('OTP Sent Successfully');
                this.isotprequired = true;

                console.log("OTP received:", otp);  // should print 9189
              },
              error: () => {
                this.isLoading = false;
                this.toastr.error('Failed to send OTP');
              }
            });

          } else {
            // OTP not required → Direct login
            this.authService.saveLoginData(res);
            this.isLoading = false;
            this.redirectUser(userType);
          }
        },

        error: () => {
          this.toastr.error('Invalid login');
          this.isLoading = false;
        }
      });
    }
    else {
debugger
      const payload = {
        username: this.username,
        password: this.password
      };

      this.authService.Adminlogin(payload).subscribe({
        next: (res) => {
          debugger
          this.authService.saveLoginData(res);

          this.usertype = this.authService.getUsertype();
          this.isotprequired = this.authService.getIsOtpRequired();
          if (!this.isotprequired) {
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
          else {
            this.isLoading = false;
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


  redirectUser(userType: string): void {
    if (userType === "Retailer") {
      this.router.navigate(['/dashboard']);
    }
    else if (userType === "SuperAdmin") {
      this.router.navigate(['/dashboard.superadmin']);
    }
    else {
      this.router.navigate(['/unauthorized']);
    }
  }

  // onSubmit(): void {
  //   this.isLoading = true;
  // const payload: LoginPayload = {
  //   username: this.username,
  //   password: this.password
  // };

  // this.authService.login(payload).subscribe({
  //   next: (res) => {
  //     debugger
  //     this.authService.saveLoginData(res);

  //     this.usertype = this.authService.getUsertype();
  //     this.isotprequired = this.authService.getIsOtpRequired();
  //     if(!this.isotprequired)
  //     {
  //     if (this.isotprequired == false && this.usertype == 'Retailer') {
  //       this.router.navigate(['/dashboard']);
  //     }
  //     else if (this.isotprequired == false && this.usertype == 'SuperAdmin') {
  //       this.router.navigate(['/dashboard.superadmin']);
  //     }
  //     else {
  //       this.router.navigate(['/unauthorized']);
  //     }
  //   }
  //   else
  //   {
  //     this.isLoading=false;
  //     this.toastr.success('Login Details Verified, Please Enter OTP')

  //   }

  //   },
  //   error: () => {
  //     this.toastr.error('Invalid login');
  //     this.isLoading = false;
  //   }
  // });
  // }

}
