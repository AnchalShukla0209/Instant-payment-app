import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EncryptionService } from '../encryption/encryption.service';
import {
  PartnerAccountProfile,
  PartnerAccountResponse,
  PartnerChangeMpinPayload,
  PartnerChangePasswordPayload,
  PartnerChangeTxnPinPayload
} from '../models/partner-account.model';

@Injectable({ providedIn: 'root' })
export class PartnerAccountService {
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/partner/account`;
  private readonly otpStorageKey = 'instantpay.partner.account.otp';

  constructor(
    private readonly http: HttpClient,
    private readonly encryptor: EncryptionService
  ) {}

  getProfile(): Observable<PartnerAccountProfile> {
    return this.http.get<PartnerAccountProfile>(`${this.baseUrl}/profile`);
  }

  validateAndSendOtp(panNo: string, aadharNo: string): Observable<PartnerAccountResponse> {
    return this.http.post<PartnerAccountResponse>(`${this.baseUrl}/validate-and-send-otp`, {
      panNo,
      aadharNo
    });
  }

  resendOtp(): Observable<PartnerAccountResponse> {
    return this.http.post<PartnerAccountResponse>(`${this.baseUrl}/resend-otp`, {});
  }

  changePassword(payload: PartnerChangePasswordPayload): Observable<PartnerAccountResponse> {
    return this.http.post<PartnerAccountResponse>(`${this.baseUrl}/change-password`, payload);
  }

  changeMpin(payload: PartnerChangeMpinPayload): Observable<PartnerAccountResponse> {
    return this.http.post<PartnerAccountResponse>(`${this.baseUrl}/change-mpin`, payload);
  }

  changeTxnPin(payload: PartnerChangeTxnPinPayload): Observable<PartnerAccountResponse> {
    return this.http.post<PartnerAccountResponse>(`${this.baseUrl}/change-txn-pin`, payload);
  }

  saveOtpFromResponse(response: PartnerAccountResponse): void {
    if (response.success && response.message) {
      sessionStorage.setItem(this.otpStorageKey, response.message);
    }
  }

  getStoredOtp(): string {
    return this.encryptor.decrypt(sessionStorage.getItem(this.otpStorageKey) || '');
  }

  clearStoredOtp(): void {
    sessionStorage.removeItem(this.otpStorageKey);
  }
}
