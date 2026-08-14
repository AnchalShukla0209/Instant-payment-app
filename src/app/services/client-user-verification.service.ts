import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ClientUserVerificationType = 'phone' | 'email';

export interface VerificationResponse {
  success: boolean;
  message: string;
  challengeId?: string;
  verificationToken?: string;
  expiresAt?: string;
  verifiedName?: string;
}

export interface CommissionPlanOption {
  id: number;
  planName: string;
}

@Injectable({ providedIn: 'root' })
export class ClientUserVerificationService {
  /** Default base used by the White-Label Admin's Client Users report. */
  readonly clientUserBase = `${environment.apiBaseUrl}/ClientUser`;
  /** Secured base used by Distributor/Master Distributor report pages (JWT-scoped, AD/MD only). */
  readonly partnerUserBase = `${environment.apiBaseUrl}/v1/partner/users`;

  constructor(private readonly http: HttpClient) {}

  sendOtp(
    type: ClientUserVerificationType,
    value: string,
    basePath: string = this.clientUserBase
  ): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(
      `${basePath}/send-${type}-otp`,
      { value }
    );
  }

  verifyOtp(
    type: ClientUserVerificationType,
    challengeId: string,
    otp: string,
    clientId: number = 0,
    basePath: string = this.clientUserBase
  ): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${basePath}/verify-otp`, {
      type,
      challengeId,
      otp,
      clientId
    });
  }

  verifyPan(
    panNumber: string,
    clientId: number = 0,
    basePath: string = this.clientUserBase
  ): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${basePath}/verify-pan`, {
      panNumber,
      clientId
    });
  }

  verifyAadhaar(
    aadharNumber: string,
    clientId: number = 0,
    basePath: string = this.clientUserBase
  ): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${basePath}/verify-aadhaar`, {
      aadharNumber,
      clientId
    });
  }

  getCommissionPlans(): Observable<{ success: boolean; data: CommissionPlanOption[] }> {
    return this.http.get<{ success: boolean; data: CommissionPlanOption[] }>(
      `${environment.apiBaseUrl}/CommissionPlan/plan/dropdown`
    );
  }

  getPartnerCommissionPlans(): Observable<{ success: boolean; data: CommissionPlanOption[] }> {
    return this.http.get<{ success: boolean; data: CommissionPlanOption[] }>(
      `${this.partnerUserBase}/commission-plans`
    );
  }
}
