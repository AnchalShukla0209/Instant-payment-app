import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, finalize } from 'rxjs';
import { LoginPayload, JwtPayload, OTPPayload } from '../models/login-payload.model';
import { LoginResponse, OTPSuccessResponse } from '../models/login-response.model';
import { environment } from '../../environments/environment';
import { EncryptionService } from '../encryption/encryption.service';
import { jwtDecode } from 'jwt-decode';
import { ServiceRightsData } from '../models/ServiceRightsData';
import { JIODailyLoginResponse } from '../models/FinoDailyLoginResponse'
import { JIODailyTokenResponse } from '../models/FinoDailyLoginResponse'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/Login`;
  private otpmatchUrl = `${environment.apiBaseUrl}/Login/verifyotp`;
  private resendotpurl = `${environment.apiBaseUrl}/Login/resendotp`;
  private serviceinfoURL = `${environment.apiBaseUrl}/Login`;
  private unlockUrl = `${environment.apiBaseUrl}/Auth/unlock`; // NEW

  constructor(private http: HttpClient, private encryptor: EncryptionService) { }

  // login(payload: LoginPayload): Observable<LoginResponse> {
  //   const encrypted = this.encryptor.encrypt(payload);
  //   return this.http.post(this.apiUrl, { data: encrypted }).pipe(
  //     map((res: any) => {
  //       const decrypted = this.encryptor.decrypt(res.data);
  //       return decrypted as LoginResponse;
  //     })
  //   );
  // }

  login(payload: any) {
    return this.http.post<LoginResponse>('https://instantpayment.co.in/api/UserLogin', payload);
  }

  Adminlogin(payload: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, payload);

  }



  // saveLoginData(res: LoginResponse): void {
  //   localStorage.setItem('token', this.encryptor.encrypt(res.Token));
  //   localStorage.setItem('username', this.encryptor.encrypt(res.Username));
  //   localStorage.setItem('usertype', this.encryptor.encrypt(res.Usertype));
  //   localStorage.setItem('OTP', this.encryptor.encrypt(res.OTP));
  //   localStorage.setItem('IsOtpRequired', this.encryptor.encrypt(res.IsOtpRequired));
  //   const decoded = jwtDecode<JwtPayload>(res.Token);
  //   localStorage.setItem('userid', this.encryptor.encrypt(decoded.userid));
  //   localStorage.setItem('phoneno', this.encryptor.encrypt(res.Phoneno));
  // }

  saveLoginData(res: any): void {

    if (!res) return;

    const d = res?.Data?.[0] || res?.data || {};

    const values = {
      sessionKey: this.encryptor.encrypt(res?.SessionKey ?? ""),
      username: this.encryptor.encrypt(d?.Name ?? d?.username ?? ""),
      userType: this.encryptor.encrypt(d?.Usertype ?? d?.usertype ?? ""),
      OTP: this.encryptor.encrypt(res?.otp) ?? "",
      IsOtpRequired: this.encryptor.encrypt(res?.OTPStatus ?? d?.isOtpRequired ?? ""),
      userid: this.encryptor.encrypt(d?.Id ?? d?.userid ?? ""),
      phoneno: this.encryptor.encrypt(d?.Phone ?? ""),
      AadharNo: this.encryptor.encrypt(d?.AadharCard ?? ""),
      PanCard: this.encryptor.encrypt(d?.PanCard ?? ""),
      EmailId: this.encryptor.encrypt(d?.EmailId ?? ""),
      CompanyName: this.encryptor.encrypt(d?.CompanyName ?? ""),
      AddressLine1: this.encryptor.encrypt(d?.AddressLine1 ?? ""),
      AddressLine2: this.encryptor.encrypt(d?.AddressLine2 ?? ""),
      City: this.encryptor.encrypt(d?.City ?? ""),
      Pincode: this.encryptor.encrypt(d?.Pincode ?? ""),
      Lat: d?.lat ?? "",
      Long: d?.longitute ?? "",
      TxnPin: this.encryptor.encrypt(d?.TxnPin ?? ""),
      MPin: this.encryptor.encrypt(d?.MPin ?? ""),
      Password: this.encryptor.encrypt(d?.Password ?? ""),
      Name: this.encryptor.encrypt(d?.Name ?? ""),
      crUserName: d?.Username ?? d?.username ?? "",
      isOtpVerified: this.encryptor.encrypt("true")
    };

    Object.entries(values).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  setPendingOTPVerification(sessionKey: string, otpRequired: boolean): void {
    localStorage.setItem('sessionKey', this.encryptor.encrypt(sessionKey));
    localStorage.setItem('otpRequired', otpRequired ? 'true' : 'false');
    localStorage.setItem('otpVerified', 'false');
  }

  setOtpVerified(): void {
    localStorage.setItem('otpVerified', 'true');
  }

  isOtpVerified(): boolean {
    const otpRequired = localStorage.getItem('otpRequired');
    const otpVerified = localStorage.getItem('otpVerified');
    
    // If OTP is not required, always return true
    if (otpRequired !== 'true') {
      return true;
    }
    
    // If OTP is required but key doesn't exist (backward compatibility), allow access
    if (!otpVerified) {
      return true;
    }
    
    // If OTP is required, check if it's verified
    return otpVerified === 'true';
  }


  sendLoginOTP(sessionKey: string) {
    return this.http.post('https://instantpayment.co.in/api/SendLoginOTP', {
      SessionKey: sessionKey
    });
  }

  verifyLoginOTP(sessionKey: string, otp: string) {
    return this.http.post(`https://instantpayment.co.in/api/VerifyLoginOTP`, {
      SessionKey: sessionKey,
      OTP: otp
    });
  }


  getSessionKey() {
    return this.encryptor.decrypt(localStorage.getItem('sessionKey') || '');
  }

  /**
   * 🔑 Unlock session with MPin or password
   * @param method "mpin" | "password"
   * @param value The MPin or password string
   */
  unlock(payload: { userId: string; method: 'mpin' | 'password'; value: string; userType: string }): Observable<any> {
    return this.http.post(this.unlockUrl, payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  saveToken(res: any): void {
    localStorage.setItem('sessionKey', this.encryptor.encrypt(res.SessionKey));
    localStorage.setItem('username', this.encryptor.encrypt(res?.Data[0]?.Name));
    localStorage.setItem('userType', this.encryptor.encrypt(res?.Data[0]?.Usertype));
    localStorage.setItem('OTP', "");
    localStorage.setItem('IsOtpRequired', this.encryptor.encrypt(res.OTPStatus));
    localStorage.setItem('userid', this.encryptor.encrypt(res?.Data[0]?.Id));
    localStorage.setItem('phoneno', this.encryptor.encrypt(res?.Data[0]?.Phone));
  
  }

  MatchOTP(payload: OTPPayload): Observable<OTPSuccessResponse> {
    const encrypted = this.encryptor.encrypt(payload);
    return this.http.post(this.otpmatchUrl, { data: encrypted }).pipe(
      map((res: any) => {
        const decrypted = this.encryptor.decrypt(res.data);
        return decrypted as OTPSuccessResponse;
      })
    );
  }

  verifyRegularOTP(sessionKey: string, otp: string): Observable<any> {
    return this.http.post('https://instantpayment.co.in/api/verifyotp', {
      SessionKey: sessionKey,
      OTP: otp
    });
  }

  ResendOTP(sessionKey: string) {
    return this.http.post('https://instantpayment.co.in/api/SendLoginOTP', {
      SessionKey: sessionKey
    }).pipe(
      map((res: any) => {
        const decrypted = res.data;
        localStorage.setItem('OTP', this.encryptor.encrypt(decrypted.OTP));
        return decrypted;
      })
    );
  }

  ResendOTPEnc(payload: OTPPayload): Observable<LoginResponse> {
    const encrypted = this.encryptor.encrypt(payload);
    return this.http.post(this.resendotpurl, { data: encrypted }).pipe(
      map((res: any) => {
        const decrypted = this.encryptor.decrypt(res.data);
        localStorage.setItem('OTP', this.encryptor.encrypt(decrypted.OTP));
        return decrypted as LoginResponse;
      })
    );
  }

  getUserRightsInfo(id: number): Observable<ServiceRightsData> {
    return this.http.get<{ data: ServiceRightsData }>(
      `${this.serviceinfoURL}/get-rightsinfo?Id=${id}`
    ).pipe(
      map(response => response.data)
    );
  }

  logout(): Observable<any> {
    return this.http.post('https://instantpayment.co.in/api/Login/logout', {}).pipe(
      finalize(() => localStorage.clear())
    );
  }

  clearOTPVerification(): void {
    localStorage.removeItem('isOtpVerified');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUsername(): string {
    return this.encryptor.decrypt(localStorage.getItem('username') || '');
  }

  getUserPhoneNo(): string {
    return this.encryptor.decrypt(localStorage.getItem('phoneno') || '');
  }

  getUsertype(): string {
    return this.encryptor.decrypt(localStorage.getItem('userType') || '');
  }

  getUserOTP(): string {
    return this.encryptor.decrypt(localStorage.getItem('OTP') || '');
  }

  getIsOtpRequired(): boolean {
    return this.encryptor.decrypt(localStorage.getItem('IsOtpRequired') || '');
  }

  getUserId(): string {
    return this.encryptor.decrypt(localStorage.getItem('userid') || '');
  }

  getUserTxnPin(): string {
    return this.encryptor.decrypt(localStorage.getItem('TxnPin') || '');
  }

  getUserMPin(): string {
    return this.encryptor.decrypt(localStorage.getItem('MPin') || '');
  }

  getcrUserName():string {
    return localStorage.getItem('crUserName') || '';
  }

  getUserPassword(): string {
    return this.encryptor.decrypt(localStorage.getItem('Password') || '');
  }

  getToken(): string | null {
    const t = localStorage.getItem('token');
    if (!t) return null;
    return this.encryptor.decrypt(t);
  }

  forgetPassword(mobile: string, aadharNumber: string, panNumber: string): Observable<any> {
    return this.http.post(
      `${environment.apiBaseUrl}/Auth/forget-password`,
      {
        mobile,
        aadharNumber,
        panNumber
      }
    );
  }

  resetPassword(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Auth/reset-password`, payload);
  }

  ValidateResetPasswordLink(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Auth/expiry-forget-password`, payload);
  }

  resendOtp(token: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Auth/resend-reset-otp`, { token });
  }

  saveJPBAEPSToken(res: JIODailyLoginResponse): void {
    localStorage.setItem('AgentLoginId', res.agentLoginId);
    localStorage.setItem('Lattitude', this.encryptor.encrypt(String(res.lattitude)));
    localStorage.setItem('Longtitude', this.encryptor.encrypt(String(res.longtitude)));
    localStorage.setItem('AgentPinCode', this.encryptor.encrypt(res.agentPinCode));
    localStorage.setItem('aepsauthtoken', res.aepsauthtoken);
    localStorage.setItem('appidentifiertoken', res.appidentifiertoken);

  }

  SaveTokenForJPB(res: JIODailyTokenResponse): void {
    localStorage.setItem('aepsauthtoken', res.aepsauthtoken);
    localStorage.setItem('appidentifiertoken', res.appidentifiertoken);

  }

  saveAgentCookies(appNo: string, agentRef: string) {
    localStorage.setItem('JPB_ApplicationNumber', this.encryptor.encrypt(appNo));
    localStorage.setItem('AgentLoginId', String(agentRef));
  }

  getAgentApplicationNumber(): string {
    return this.encryptor.decrypt(localStorage.getItem('JPB_ApplicationNumber') || '');
  }

  getAgentLoginId(): string {
    return localStorage.getItem('AgentLoginId') || '';
  }

  getAgentLattitude(): string {
    return this.encryptor.decrypt(localStorage.getItem('Lattitude') || '');
  }

  getAgentLongtitude(): string {
    return this.encryptor.decrypt(localStorage.getItem('Longtitude') || '');
  }

  getAgentPinCode(): string {
    return this.encryptor.decrypt(localStorage.getItem('AgentPinCode') || '');
  }

  getAgentAccessToken(): string {
    return localStorage.getItem('aepsauthtoken') || '';
  }

  getAgentAppIdentifierToken(): string {
    return localStorage.getItem('appidentifiertoken') || '';
  }

  getUserLat(): string {
    return localStorage.getItem('Lat') || '';
  }

  getUserLongtitude(): string {
    return localStorage.getItem('Long') || '';
  }

  getUserAadharNumber(): string {
    return this.encryptor.decrypt(localStorage.getItem('AadharNo') || '');
  }
  getUserEmailId(): string {
    return this.encryptor.decrypt(localStorage.getItem('EmailId') || '');
  }
  getUserCompanyName(): string {
    return this.encryptor.decrypt(localStorage.getItem('CompanyName') || '');
  }
  getUserPanCard(): string {
    return this.encryptor.decrypt(localStorage.getItem('PanCard') || '');
  }
  getUserAddressLine1(): string {
    return this.encryptor.decrypt(localStorage.getItem('AddressLine1') || '');
  }
  getUserAddressLine2(): string {
    return this.encryptor.decrypt(localStorage.getItem('AddressLine2') || '');
  }
  getUserCity(): string {
    return this.encryptor.decrypt(localStorage.getItem('City') || '');
  }
  getUserPincode(): string {
    return this.encryptor.decrypt(localStorage.getItem('Pincode') || '');
  }
  getUserName(): string {
    return this.encryptor.decrypt(localStorage.getItem('Name') || '');
  }
  SaveOTPinCookies(res: any): void {
    localStorage.setItem('OTP', res.message);
  }
  updateUserInfo(payload: any): Observable<any> {
    return this.http.post(
      `${environment.apiBaseUrl}/Auth/UpdateUserInfo`,
      payload
    );
  }

  ValidateUserInfo(payload: any): Observable<any> {
    return this.http.post(
      `${environment.apiBaseUrl}/Auth/ValidateUserInfoAndSentOTP`,
      payload
    );
  }

}
