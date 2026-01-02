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
    let authReq = req;
     const skipUrls = [
      '/DMTSenderinfo',
      '/DMTKYCProcess',
      '/DMTSendOTP',
      '/DMTAddSender',
      '/HAddBene',
      '/HBeneInfo'
    ];

    let userid = '';
    let username = '';

    try {
      userid = String(this.encryptor.decrypt(localStorage.getItem('userid') || '') || '');
      username = String(this.encryptor.decrypt(localStorage.getItem('username') || '') || '');
    } catch (e) {
      userid = '';
      username = '';
    }

    const modifiedReq = req.clone({
      setHeaders: {
        userid: userid || '',
        username: username || ''
      }
    });

    if (skipUrls.some(url => req.url.includes(url))) {
      return next.handle(req);
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
