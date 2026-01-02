import { Injectable } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service'; // your existing AES decryptor
import { WalletBalance } from '../models/DashboardData'
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {

   private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient, private encryptor: EncryptionService) {}

   getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`).pipe(
      map(res => this.encryptor.decrypt(res.data))
    );
  }

  getWalletBalance(userId: number, userName: string): Observable<WalletBalance> {
    const params = new HttpParams()
      .set('UserId', userId.toString())
      .set('UserName', userName);
    return this.http.get<WalletBalance>(`${this.apiUrl}/Dashboard/GetWalletBalance`, { params });
  }
}
