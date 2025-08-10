import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map  } from 'rxjs';
import { GetUsersWithMainBalanceQuery, UserModel, GetUsersWithMainBalanceResponse, GetClientUsersWithMainBalanceResponse } from '../models/ClientData';
import { environment } from '../../environments/environment';
import { EncryptionService } from '../encryption/encryption.service';
import { CommonModule } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ClientReportService {

  private url = `${environment.apiBaseUrl}/Client/Client-Report`;
  private url2 = `${environment.apiBaseUrl}/ClientUser/Client-Report`;

  constructor(private http: HttpClient, private encryptor: EncryptionService) {}

getClientReport(payload: GetUsersWithMainBalanceQuery): Observable<GetUsersWithMainBalanceResponse> {
  const encrypted = this.encryptor.encrypt(payload);
  return this.http.post(this.url, { data: encrypted }).pipe(
    map((res: any) => {
      const decrypted = this.encryptor.decrypt(res.data);
      return decrypted as GetUsersWithMainBalanceResponse;
      console.log(decrypted);
    })
  );
}


getClientUserReport(payload: GetUsersWithMainBalanceQuery): Observable<GetClientUsersWithMainBalanceResponse> {
  const encrypted = this.encryptor.encrypt(payload);
  return this.http.post(this.url2, { data: encrypted }).pipe(
    map((res: any) => {
      const decrypted = this.encryptor.decrypt(res.data);
      return decrypted as GetClientUsersWithMainBalanceResponse;
      console.log(decrypted);
    })
  );
}


}
