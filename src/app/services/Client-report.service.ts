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
  /** Secured, unencrypted endpoint for Distributor/Master Distributor scoped reports (JWT-authorized, AD/MD only). */
  private partnerUsersUrl = `${environment.apiBaseUrl}/v1/partner/users/report`;

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

/** Used by Distributor/Master Distributor report pages. Scope is enforced server-side from the JWT, so no encryption is required. */
getPartnerUserReport(payload: GetUsersWithMainBalanceQuery): Observable<GetClientUsersWithMainBalanceResponse> {
  return this.http.post<GetClientUsersWithMainBalanceResponse>(this.partnerUsersUrl, payload);
}


}
