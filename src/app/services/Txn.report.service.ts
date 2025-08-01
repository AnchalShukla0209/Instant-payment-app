import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map  } from 'rxjs';
import { TxnReportPayload, TxnReportData, PaginatedTxnResultDto } from '../models/TxnReport.model';
import { environment } from '../../environments/environment';
import { EncryptionService } from '../encryption/encryption.service';


@Injectable({
  providedIn: 'root'
})
export class TxnReportService {

  private url = `${environment.apiBaseUrl}/Report/Txn-Report`;

  constructor(private http: HttpClient, private encryptor: EncryptionService) {}

getTxnReport(payload: TxnReportPayload): Observable<PaginatedTxnResultDto> {
  const encrypted = this.encryptor.encrypt(payload);
  return this.http.post(this.url, { data: encrypted }).pipe(
    map((res: any) => {
      const decrypted = this.encryptor.decrypt(res.data);
      return decrypted as PaginatedTxnResultDto;
      console.log(decrypted);
    })
  );
}


}
