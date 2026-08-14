import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequestDto, PaymentResponse, PaginatedPaymentResponse } from '../models/payment-request.model';
import { BankDto } from '../models/BankDto';
import { environment } from '../../environments/environment';

/**
 * Self-service wallet top-up API for Distributor (AD) / Master Distributor (MD) partners -
 * mirrors `PaymentService` (used by the retailer `Payment-Request` / `Payment-Request-User-Report`
 * pages) but talks to the JWT-secured `api/v1/partner/payment` endpoints, which always scope
 * create/list/download to the logged-in partner themselves (never a client-supplied user id).
 */
@Injectable({ providedIn: 'root' })
export class PartnerPaymentService {
  private readonly apiUrl = `${environment.apiBaseUrl}/v1/partner/payment`;

  constructor(private readonly http: HttpClient) {}

  getActiveBanks(): Observable<BankDto[]> {
    return this.http.get<BankDto[]>(`${this.apiUrl}/banks/active`);
  }

  getBankById(id: string): Observable<BankDto> {
    return this.http.get<BankDto>(`${this.apiUrl}/banks/${id}`);
  }

  create(request: PaymentRequestDto): Observable<string> {
    const formData = new FormData();
    formData.append('BankId', request.bankId);
    formData.append('Amount', request.amount.toString());
    formData.append('PaymentTxnId', request.paymentTxnId?.toString() ?? '');
    formData.append('UserRemarks', request.userRemarks?.toString() ?? '');
    if (request.deposideMode) {
      formData.append('DeposideMode', request.deposideMode);
    }
    if (request.txnSlip) {
      formData.append('TxnSlip', request.txnSlip, request.txnSlip.name);
    }

    return this.http.post<string>(this.apiUrl, formData);
  }

  getAllPayments(
    pageNumber: number = 1,
    pageSize: number = 10,
    status?: string,
    fromDate?: string,
    toDate?: string,
    commonsearch?: string,
    isExport?: number
  ): Observable<PaginatedPaymentResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);
    if (fromDate) params = params.set('fromDate', new Date(fromDate).toISOString());
    if (toDate) params = params.set('toDate', new Date(toDate).toISOString());
    if (commonsearch) params = params.set('commonsearch', commonsearch);
    params = params.set('isExport', Number(isExport ?? 0));

    return this.http.get<PaginatedPaymentResponse>(this.apiUrl, { params });
  }

  downloadTxnSlip(paymentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${paymentId}`, { responseType: 'blob' });
  }

  getPaymentById(paymentId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/${paymentId}`);
  }
}
