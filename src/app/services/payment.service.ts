import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequestDto, PaymentResponse, PaymentUpdateRequest, PaginatedPaymentResponse } from '../models/payment-request.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiBaseUrl}/Payment`;
  constructor(private http: HttpClient) { }

  create(request: PaymentRequestDto): Observable<string> {
    const formData = new FormData();
    formData.append('BankId', request.bankId);
    formData.append('UserId', request.userId.toString());
    formData.append('Amount', request.amount.toString());
    formData.append('TxnId', request.txnId);
    if (request.deposideMode) {
      formData.append('DeposideMode', request.deposideMode);
    }
    if (request.txnSlip) {
      formData.append('TxnSlip', request.txnSlip, request.txnSlip.name);
    }

    return this.http.post<string>(`${this.apiUrl}`, formData);
  }

  getAllPayments(
    pageNumber: number = 1,
    pageSize: number = 10,
    status?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<PaginatedPaymentResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);
    if (fromDate) {
      const from = new Date(fromDate);
      params = params.set('fromDate', from.toISOString());
    }

    if (toDate) {
      const to = new Date(toDate);
      params = params.set('toDate', to.toISOString());
    }

    return this.http.get<PaginatedPaymentResponse>(`${this.apiUrl}`, { params });
  }

  updatePayment(request: PaymentUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}`, request);
  }

  downloadTxnSlip(paymentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${paymentId}`, { responseType: 'blob' });
  }

  getPaymentById(paymentId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/${paymentId}`);
  }


}
