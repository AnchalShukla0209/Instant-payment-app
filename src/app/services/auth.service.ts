import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map  } from 'rxjs';
import { LoginPayload,JwtPayload,OTPPayload } from '../models/login-payload.model';
import { LoginResponse,OTPSuccessResponse } from '../models/login-response.model';
import { environment } from '../../environments/environment';
import { EncryptionService } from '../encryption/encryption.service';
import { jwtDecode } from 'jwt-decode';
import {ServiceRightsData} from '../models/ServiceRightsData'


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/Login`;
  private otpmatchUrl = `${environment.apiBaseUrl}/Login/verifyotp`;
  private resendotpurl = `${environment.apiBaseUrl}/Login/resendotp`;
  private serviceinfoURL = `${environment.apiBaseUrl}/Login`;

  constructor(private http: HttpClient,private encryptor: EncryptionService) {}

login(payload: LoginPayload): Observable<LoginResponse> {
  const encrypted = this.encryptor.encrypt(payload);
  return this.http.post(this.apiUrl, { data: encrypted }).pipe(
    map((res: any) => {
      const decrypted = this.encryptor.decrypt(res.data);
      return decrypted as LoginResponse;
      console.log(decrypted);
    })
  );
}


  saveLoginData(res: LoginResponse): void {
    localStorage.setItem('token', this.encryptor.encrypt(res.Token));
    localStorage.setItem('username', this.encryptor.encrypt(res.Username));
    localStorage.setItem('usertype', this.encryptor.encrypt(res.Usertype));
    localStorage.setItem('OTP', this.encryptor.encrypt(res.OTP));
    localStorage.setItem('IsOtpRequired', this.encryptor.encrypt(res.IsOtpRequired));
    const decoded = jwtDecode<JwtPayload>(res.Token);
    localStorage.setItem('userid', this.encryptor.encrypt(decoded.userid));
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

 
  ResendOTP(payload: OTPPayload): Observable<LoginResponse> {
    
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

  logout(): void {
    localStorage.clear();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUsername(): string {
    return this.encryptor.decrypt(localStorage.getItem('username') || '');
  }

  getUsertype(): string {
    return this.encryptor.decrypt(localStorage.getItem('usertype') || '');
  }

   getUserOTP(): string {
    return this.encryptor.decrypt(localStorage.getItem('OTP') || '');
  }

  getIsOtpRequired(): boolean {
    return this.encryptor.decrypt(localStorage.getItem('IsOtpRequired') || '');
  }

  getUserId(): number {
    return this.encryptor.decrypt(localStorage.getItem('userid') || '');
  }
}
