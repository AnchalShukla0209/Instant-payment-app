import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map  } from 'rxjs';
import { GetUsersWithMainBalanceQuery, UserModel, GetUsersWithMainBalanceResponse } from '../models/ClientData';
import { environment } from '../../environments/environment';
import { EncryptionService } from '../encryption/encryption.service';


@Injectable({
  providedIn: 'root'
})
export class ClientReportService {

  private url = `${environment.apiBaseUrl}/Client/Client-Report`;

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


}
