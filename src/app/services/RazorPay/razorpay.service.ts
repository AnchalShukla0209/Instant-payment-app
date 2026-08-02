import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class RazorpayService {

  private baseUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  createOrder(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/razorpay/create-order`, data);
  }

  verifyPayment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/razorpay/verify`, data);
  }
}