import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { defer, Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { EncryptionService } from '../encryption/encryption.service';
import { GlobalLoaderService } from './global-loader.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private encryptor: EncryptionService,
    private router: Router,
    private loader: GlobalLoaderService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Read the role before getDistributorSession removes an expired session so a
    // subsequent 401 can still return the user to the correct partner login page.
    const storedPartnerUserType = this.getStoredPartnerUserType();
    const distributorSession = this.getDistributorSession();
    const token = distributorSession?.accessToken
      || this.encryptor.decrypt(localStorage.getItem('token') || '')
      || '';
     const skipUrls = [
      '/DMTSenderinfo',
      '/DMTKYCProcess',
      '/DMTSendOTP',
      '/DMTAddSender',
      '/HAddBene',
      '/HBeneInfo',
      '/api/UserLogin',
      '/api/SendLoginOTP',
      '/api/verifyotp',
      '/Login/verifyotp',
      '/VerifyLoginOTP',
      '/v1/distributor/auth/',
      '/v1/master-distributor/auth/',
      '/v1/sales-team/auth/',
      '/Login'
    ];

    let userid = '';
    let username = '';
    let plateform = 'web';

    try {
      userid = distributorSession?.userId
        || String(this.encryptor.decrypt(localStorage.getItem('userid') || '') || '');
      username = distributorSession?.username
        || String(localStorage.getItem('crUserName') || '');
      plateform = 'web';
    } catch (e) {
      userid = '';
      username = '';
      plateform = 'web';
    }

    const modifiedReq = req.clone({
      setHeaders: {
        token: token || '',
        Authorization: token ? `Bearer ${token}` : '',
        userid: userid || '',
        username: username || '',
        platform: plateform || 'web',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    let request$: Observable<HttpEvent<any>>;
    if (skipUrls.some(url => req.url.includes(url))) {
      request$ = next.handle(modifiedReq);
    } else {
      // Check OTP verification for protected API calls
      const otpRequired = localStorage.getItem('otpRequired');
      const otpVerified = localStorage.getItem('otpVerified');
      if (!distributorSession && otpRequired === 'true' && otpVerified !== 'true') {
        this.router.navigate(['/login']);
        request$ = throwError(() => new Error('OTP verification required'));
      } else {
        request$ = next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          const partnerUserType = distributorSession?.userType || storedPartnerUserType;
          if (partnerUserType) {
            sessionStorage.removeItem('instantpay.distributor.session');
            this.router.navigate([this.getPartnerLoginRoute(partnerUserType)]);
          } else {
            localStorage.clear();
            this.router.navigate(['/login']);
          }
        }

        return throwError(() => error);
      })
        );
      }
    }

    return defer(() => {
      this.loader.show();
      return request$.pipe(finalize(() => this.loader.hide()));
    });
  }

  private getStoredPartnerUserType(): 'AD' | 'MD' | 'ST' | null {
    const value = sessionStorage.getItem('instantpay.distributor.session');
    if (!value) return null;

    try {
      const userType = JSON.parse(value).userType;
      return userType === 'AD' || userType === 'MD' || userType === 'ST'
        ? userType
        : null;
    } catch {
      return null;
    }
  }

  private getPartnerLoginRoute(userType: 'AD' | 'MD' | 'ST'): string {
    return userType === 'MD' ? '/master-distributor-login'
      : userType === 'ST' ? '/salesteam-login'
        : '/distributor-login';
  }

  private getDistributorSession(): {
    accessToken: string;
    userId: string;
    username: string;
    userType: 'AD' | 'MD' | 'ST';
    expiresAt: number;
  } | null {
    const value = sessionStorage.getItem('instantpay.distributor.session');
    if (!value) return null;

    try {
      const session = JSON.parse(value);
      if (!session.accessToken || session.expiresAt <= Date.now()) {
        sessionStorage.removeItem('instantpay.distributor.session');
        return null;
      }
      return session;
    } catch {
      sessionStorage.removeItem('instantpay.distributor.session');
      return null;
    }
  }
}
