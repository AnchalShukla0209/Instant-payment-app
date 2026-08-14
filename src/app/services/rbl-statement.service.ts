import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RblStatementService {
  private readonly baseUrl = `${environment.apiBaseUrl}/rbl/statement`;

  constructor(private http: HttpClient) {}

  getDateRange(fromDate: string, toDate: string, transactionType: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/date-range`, {
      Acc_Stmt_DtRng_Req: {
        Header: {},
        Body: {
          Acc_No: '', Tran_Type: transactionType, From_Dt: fromDate,
          Pagination_Details: this.emptyPagination(), To_Dt: toDate
        },
        Signature: {}
      }
    });
  }

  getPeriod(period: string, transactionType: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/period`, {
      Acc_Stmt_Period_Req: {
        Header: {},
        Body: {
          Acc_No: '', Tran_Type: transactionType, Period: period,
          Pagination_Details: this.emptyPagination()
        },
        Signature: {}
      }
    });
  }

  private emptyPagination() {
    return {
      Last_Balance: { Amount_Value: '', Currency_Code: '' },
      Last_Pstd_Date: '', Last_Txn_Date: '', Last_Txn_Id: '', Last_Txn_SrlNo: ''
    };
  }
}
