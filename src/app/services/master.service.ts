import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MasterService {

   private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient, private encryptor: EncryptionService) {}

   getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`).pipe(
      map(res => this.encryptor.decrypt(res.data))
    );
  }
}
