import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service'; // your existing AES decryptor
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RechargeService {

   private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient, private encryptor: EncryptionService) {}

  submitRecharge(payload: any): Observable<any> {
  const encryptedPayload = this.encryptor.encrypt(JSON.stringify(payload));
  return this.http.post<any>(`${this.apiUrl}/Recharge/submit`, { data: encryptedPayload }).pipe(
    map((res) => {
      if (res?.data) {
        const decrypted = this.encryptor.decrypt(res.data);
        if (typeof decrypted === 'string') {
          try {
            return JSON.parse(decrypted); // Decrypt returns stringified JSON
          } catch (e) {
            console.error('Decryption failed', e);
            return null;
          }
        }
        // Already a JS object
        return decrypted;
      }
      return res;
    })
  );
}

}

