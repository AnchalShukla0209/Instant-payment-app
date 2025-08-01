import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
     constructor(private encryptor: EncryptionService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    const token = localStorage.getItem('token');

    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${this.encryptor.decrypt(token)}`
        }
      });
      return next.handle(cloned);
    } else {
      return next.handle(req);
    }
  }
}
