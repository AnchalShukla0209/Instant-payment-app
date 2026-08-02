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
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { WebsiteInfoService, WebsiteInfo } from '../../services/website-info.service';
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
  isForgetPassword = false;
  isResetPassword = false;

  otp = '';
  newPassword = '';
  token = '';
  message = '';
  resendTimer = 30;
  canResend = false;
  userpassword = '';
  isForgetPasswordflag = false;
  showInputAAdharError = false;
  showInputPANError = false;
  showMobileError = false;
  aadharNumberinp = '';
  panNumberinp = '';
  showAadharNo = false;
  showPanNo = false;
  registeredmobNo = '';


  response: any = [];
  websiteInfo: WebsiteInfo | null = null;
  logoUrl: string = '../../../assets/images/logo_2.png';

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService, private websiteInfoService: WebsiteInfoService) { }

  showTxnPin = false;
  showMPin = false;

  toggleTxnPin() {
    this.showTxnPin = !this.showTxnPin;
  }

  LoginRedirect() {
    this.isForgetPasswordflag = false;
    this.router.navigate(['/login']);
  }

  toggleMPin() {
    this.showMPin = !this.showMPin;
  }

  forgetpasswordlink() {
    this.isForgetPasswordflag = true;
  }

  verifyOTP(): void {
    this.isLoading = true;

    const d = this.response?.Data?.[0] || {};
    const sessionKey = this.authService.getSessionKey();
    const enteredOtp = this.inputotp;

    if (!enteredOtp) {
      this.isLoading = false;
      this.toastr.error('Please enter OTP');
      return;
    }

    // Check if admin login (usertype at root level) or regular login (usertype in Data[0])
    const isAdminLogin = this.response?.data?.usertype && !this.response?.Data?.[0];

    if (isAdminLogin) {
      // Use MatchOTP for admin login
      const payload: OTPPayload = {
        usertype: this.response.data.usertype,
        userid: this.response.data.userid,
        otp : enteredOtp
      };

      this.authService.MatchOTP(payload).subscribe({
        next: (res: any) => {
          if (!res) {
            this.toastr.error('Invalid OTP');
            this.isLoading = false;
            return;
          }

          if (res.Token || res.messaege === 'OTP Verified Successfully') {
            this.authService.setOtpVerified();
            this.toastr.success(res.messaege || res.Message || 'OTP Verified Successfully');
            this.authService.saveLoginData(this.response);
            this.isLoading = false;
            this.usertype = this.response.data.usertype;
            if (this.usertype == 'SuperAdmin') {
              this.router.navigate(['/dashboard.superadmin']);
            } else {
              this.router.navigate(['/unauthorized']);
            }
          }
          else {
            this.toastr.error(res.Message || res.messaege || 'Invalid OTP! Please Try Again.');
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('MatchOTP error:', err);
          this.toastr.error(err.error?.Message || err.message || 'Invalid login');
          this.isLoading = false;
        }
      });
    } else {
      // Use verifyLoginOTP for regular login
      this.authService.verifyLoginOTP(sessionKey, enteredOtp).subscribe({
        next: (res: any) => {
          if (res.Status_Code === "1") {
            this.authService.setOtpVerified();
            this.toastr.success(res.Message || 'OTP Verified Successfully');
            if (this.response?.Data?.length > 0) {
              this.authService.saveLoginData(this.response);
            }
            this.isLoading = false;
            this.usertype = this.authService.getUsertype() ?? d?.Usertype;
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
          else if (res.Status_Code === "2") {
            this.toastr.error(res.Message || 'Session Expired! Please Login Again.');
            this.isLoading = false;
            this.router.navigate(['/login']);
          }
          else {
            this.toastr.error(res.Message || 'Invalid OTP! Please Try Again.');
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('verifyLoginOTP error:', err);
          this.toastr.error(err.error?.Message || err.message || 'Invalid login');
          this.isLoading = false;
        }
      });
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
    this.loadWebsiteInfo();
    this.getLocation();
    this.isLoading = false;

  }

  loadWebsiteInfo(): void {
    this.websiteInfoService.getWebsiteInfo().subscribe({
      next: (info) => {
        if (info && info.isActive) {
          this.websiteInfo = info;
          if (info.logoUrl) {
            this.logoUrl = info.logoUrl;
          }
        }
      },
      error: (err) => {
        console.warn('Failed to load website info:', err);
      }
    });
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

  getDeviceID(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID() || this.generateUUID();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async getBrowserFingerprint(): Promise<string> {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  }


  async onSubmit(): Promise<void> {
    this.isLoading = true;

    if (this.username != 'admin') {
      const deviceId = this.getDeviceID();
      const browserFingerprint = await this.getBrowserFingerprint();

      const payload: LoginPayload = {
        UserName: this.username,
        Password: this.password,
        lat: this.latitude,
        long: this.longitude,
        ApiKey: "Login001",
        DeviceID: deviceId,
        TokenKey: "aaa",
        DeviceInfo: "aaa",
        BrowserFingerprint: browserFingerprint
      };

      this.authService.login(payload).subscribe({
        next: (res: any) => {
          
          if (res.Message === 'Login Failed.') {
            this.toastr.error(res.Data);
            this.isLoading = false;
            return;
          }
          else if (res.Message == "Your account is locked. Please try after 15 mins or contact admin.") {
            this.toastr.error(res.Message || 'Login Failed');
            this.isLoading = false;
            return;
          }
          res.Data[0].Usertype = res?.Data[0]?.Usertype == 'RT' ? 'Retailer' : res?.Data[0]?.Usertype;
          this.response = res;
          const otpStatus = res.OTPStatus;
          const sessionKey = res.SessionKey;
          const userType = res.Data?.[0]?.Usertype;
          if (otpStatus === "YES") {

            this.authService.setPendingOTPVerification(sessionKey, true);
            
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

      const payload = {
        username: this.username,
        password: this.password
      };

      this.authService.Adminlogin(payload).subscribe({
        next: (res: any) => {
          if (res.data.messaege === 'Login Failed.' || !res.data.token) {
            this.toastr.error(res.messaege || res.Data || 'Login Failed');
            this.isLoading = false;
            return;
          }

          this.response = res;
          const isOtpRequired = true;
          const token = res.data.token;
          const userType = res.data.usertype;

          if (isOtpRequired === true) {
            this.isotprequired = true;
            this.authService.setPendingOTPVerification(token, true);
            this.isLoading = false;
            this.toastr.success('Login Details Verified, Please Enter OTP');
          } else {
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


  showForgetPassword() {
    this.isInputLogin = false;
    this.isForgetPassword = true;
  }

  sendResetLink() {

    if (this.registeredmobNo.trim() == "" || this.registeredmobNo.length < 10 || this.registeredmobNo.length > 10) {
      this.toastr.error("Please Enter Registered Mobile Number!");
      this.showMobileError = true;
      return;
    }

    else if (this.aadharNumberinp.trim() == "" && this.panNumberinp.trim() == "") {
      this.toastr.error("Please Enter Aadhar Number And PAN Number!");
      this.showInputAAdharError = true;
      this.showInputPANError = true;
      return;
    }

    else if (this.aadharNumberinp.trim() == "" || this.aadharNumberinp.length < 12 || this.aadharNumberinp.length > 12) {
      this.toastr.error("Please Enter valid Aadhar Number!");
      this.showInputPANError = false;
      this.showInputAAdharError = true;
      return;
    }
    else if (this.panNumberinp.trim() == "" || this.panNumberinp.length < 10 || this.panNumberinp.length > 10) {
      this.toastr.error("Please Enter valid PAN Number!");
      this.showInputAAdharError = false;
      this.showInputPANError = true;
      return;
    }

    else {

      this.showInputAAdharError = false;
      this.showInputPANError = false;
      this.showMobileError = false;
      this.isLoading = true;
      this.authService
        .forgetPassword(
          this.registeredmobNo,
          this.aadharNumberinp,
          this.panNumberinp
        )
        .subscribe({
          next: (res: any) => {
            this.isLoading = false;

            if (res.success) {
              this.toastr.success(res.message);
              this.isForgetPassword = false;
              this.isResetPassword = true;
              this.panNumberinp="";
              this.aadharNumberinp="";
              this.registeredmobNo="";
            } else {
              this.toastr.error(res.message);
            }
          },
          error: err => {
            this.isLoading = false;
            this.toastr.error(err.error?.message || "Something went wrong");
          }
        });


    }
  }


}
