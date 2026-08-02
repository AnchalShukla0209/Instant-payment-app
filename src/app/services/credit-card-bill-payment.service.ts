import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CreditCardBillPaymentService {

  private baseUrl = `${environment.apiBaseUrl}/CreditCardBillPayment`;

  constructor(private http: HttpClient) { }

  getOperators(): Observable<any> {
    return this.http.get(`${this.baseUrl}/operators`);
  }

  fetchBill(payload: { provider: number; number: string; customerMobileNumber: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/fetch-bill`, payload);
  }

  payBill(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/pay`, payload);
  }
}
