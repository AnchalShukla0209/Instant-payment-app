import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private encryptor: EncryptionService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.encryptor.decrypt(localStorage.getItem('token') || '') || '';
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
      '/Login'
    ];

    let userid = '';
    let username = '';
    let plateform = 'web';

    try {
      userid = String(this.encryptor.decrypt(localStorage.getItem('userid') || '') || '');
      username = String(localStorage.getItem('crUserName') || '');
      plateform = 'web';
    } catch (e) {
      userid = '';
      username = '';
      plateform = 'web';
    }

    const modifiedReq = req.clone({
      setHeaders: {
        token: token || '',
        userid: userid || '',
        username: username || '',
        platform: plateform || 'web',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (skipUrls.some(url => req.url.includes(url))) {
      return next.handle(modifiedReq);
    }

    // Check OTP verification for protected API calls
    const otpRequired = localStorage.getItem('otpRequired');
    const otpVerified = localStorage.getItem('otpVerified');
    if (otpRequired === 'true' && otpVerified !== 'true') {
      this.router.navigate(['/login']);
      return throwError(() => new Error('OTP verification required'));
    }

    return next.handle(modifiedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        const isLoggedIn = !!localStorage.getItem('token');
        
        if (error.status === 401) {
          localStorage.clear();
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }
}
