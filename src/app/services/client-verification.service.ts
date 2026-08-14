import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ClientUserVerificationType, VerificationResponse, CommissionPlanOption } from './client-user-verification.service';

/**
 * Verification service for the Client (White-Label admin) module.
 * Mirrors ClientUserVerificationService but targets the /Client controller
 * endpoints so tblWlUsers records are verified/persisted independently of
 * the retailer-level ClientUser (tblUsers) verification flow.
 */
@Injectable({ providedIn: 'root' })
export class ClientVerificationService {
  private readonly clientUrl = `${environment.apiBaseUrl}/Client`;

  constructor(private readonly http: HttpClient) {}

  sendOtp(type: ClientUserVerificationType, value: string): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(
      `${this.clientUrl}/send-${type}-otp`,
      { value }
    );
  }

  verifyOtp(
    type: ClientUserVerificationType,
    challengeId: string,
    otp: string,
    clientId: number = 0
  ): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.clientUrl}/verify-otp`, {
      type,
      challengeId,
      otp,
      clientId
    });
  }

  verifyPan(panNumber: string, clientId: number = 0): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.clientUrl}/verify-pan`, {
      panNumber,
      clientId
    });
  }

  verifyAadhaar(aadharNumber: string, clientId: number = 0): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.clientUrl}/verify-aadhaar`, {
      aadharNumber,
      clientId
    });
  }

  getCommissionPlans(): Observable<{ success: boolean; data: CommissionPlanOption[] }> {
    return this.http.get<{ success: boolean; data: CommissionPlanOption[] }>(
      `${environment.apiBaseUrl}/CommissionPlan/plan/dropdown`
    );
  }
}
