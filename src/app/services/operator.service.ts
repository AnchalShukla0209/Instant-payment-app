import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service'; // your existing AES decryptor
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OperatorService {

   private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient, private encryptor: EncryptionService) {}

   getOperators(serviceName: string): Observable<any> {
    const encryptedServiceName = this.encryptor.encrypt(serviceName);
    debugger
    return this.http.post<any>(`${this.apiUrl}/Operator/get-operators`,{ serviceName: encryptedServiceName }).pipe(
      
      map(res => this.encryptor.decrypt(res.data))
    );
  }
}
