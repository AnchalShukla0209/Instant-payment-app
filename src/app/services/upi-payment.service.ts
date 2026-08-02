import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpiPaymentService {

  private baseUrl = 'https://instantpayment.co.in/api/';

  constructor(private http: HttpClient) { }

  initiatePayment(data: any): Observable<any> {
    return this.http.post(this.baseUrl + 'InitiateUPIPayment', data);
  }

  checkPaymentStatus(data: any): Observable<any> {
    return this.http.post(this.baseUrl + 'UpdateUPIPaymentStatus', data);
  }

  initiateUPIPayment(data: any): Observable<any> {
    return this.http.post(this.baseUrl + 'UPI2MoneyTransfer', data);
  }
}
