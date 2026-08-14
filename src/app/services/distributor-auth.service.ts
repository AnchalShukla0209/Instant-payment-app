import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DistributorLoginChallenge,
  DistributorLoginRequest,
  DistributorOtpRequest,
  DistributorSession,
  PartnerUserType
} from '../models/distributor-auth.model';

@Injectable({ providedIn: 'root' })
export class DistributorAuthService {
  private readonly sessionKey = 'instantpay.distributor.session';
  private readonly deviceKey = 'instantpay.partner.device';

  constructor(private readonly http: HttpClient) {}

  login(
    username: string,
    password: string,
    userType: PartnerUserType = 'AD'
  ): Observable<DistributorLoginChallenge> {
    const request: DistributorLoginRequest = {
      username: username.trim(),
      password,
      platform: 'web',
      deviceId: this.getDeviceId(userType)
    };

    return this.http
      .post<DistributorLoginChallenge>(`${this.getBaseUrl(userType)}/login`, request)
      .pipe(
        map(response => {
          if (!response.otpRequired && response.session) {
            response.session = this.saveSession(response.session);
          }
          return response;
        })
      );
  }

  verifyOtp(
    challengeId: string,
    otp: string,
    userType: PartnerUserType = 'AD'
  ): Observable<DistributorSession> {
    const request: DistributorOtpRequest = { challengeId, otp };
    return this.http
      .post<Omit<DistributorSession, 'expiresAt'>>(
        `${this.getBaseUrl(userType)}/verify-otp`,
        request
      )
      .pipe(
        map(response => {
          return this.saveSession(response);
        })
      );
  }

  getSession(): DistributorSession | null {
    const stored = sessionStorage.getItem(this.sessionKey);
    if (!stored) {
      return null;
    }

    try {
      const session = JSON.parse(stored) as DistributorSession;
      if (
        !session.accessToken ||
        !['AD', 'MD'].includes(session.userType) ||
        session.expiresAt <= Date.now()
      ) {
        this.clearSession();
        return null;
      }
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    sessionStorage.removeItem(this.sessionKey);
  }

  private getDeviceId(userType: PartnerUserType): string {
    const key = `${this.deviceKey}.${userType.toLowerCase()}`;
    let deviceId = localStorage.getItem(key);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(key, deviceId);
    }
    return deviceId;
  }

  private saveSession(
    response: Omit<DistributorSession, 'expiresAt'> | DistributorSession
  ): DistributorSession {
    const session: DistributorSession = {
      ...response,
      expiresAt: Date.now() + response.expiresInSeconds * 1000
    };
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session));

    // A fresh, successful login must always start "unlocked". Without this, a stale
    // `isLocked=true` (set by IdleService after 10 minutes of inactivity at any point,
    // even before this login) sticks around in localStorage forever — since nothing else
    // ever clears it for the partner flow — and re-triggers the idle-lock handler on the
    // very next page reload, wiping this brand-new session and bouncing back to login.
    localStorage.setItem('isLocked', 'false');
    localStorage.setItem('lastActivity', Date.now().toString());

    return session;
  }

  private getBaseUrl(userType: PartnerUserType): string {
    const segment = userType === 'AD' ? 'distributor' : 'master-distributor';
    return `${environment.apiBaseUrl}/v1/${segment}/auth`;
  }
}
