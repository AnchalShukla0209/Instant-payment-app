import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TxnReportPayload, PaginatedTxnResultDto } from '../models/TxnReport.model';
import { environment } from '../../environments/environment';

export interface PartnerUserDropdownOption {
  id: number;
  label: string;
}

/**
 * Distributor / Master Distributor downline transaction report - mirrors `TxnReportService`
 * (used by the retailer `/UserTxnReports` page) but talks to the JWT-secured
 * `api/v1/partner/report/txn-report` endpoint, which is always scoped server-side to every
 * user under the logged-in partner's network (Adid/Mdid), plus the partner's own
 * transactions - never a client-supplied user id. Response is plain (unencrypted) JSON.
 */
@Injectable({ providedIn: 'root' })
export class PartnerReportService {
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/partner/report`;

  constructor(private readonly http: HttpClient) {}

  getTxnReport(payload: TxnReportPayload): Observable<PaginatedTxnResultDto> {
    return this.http.post<PaginatedTxnResultDto>(`${this.baseUrl}/txn-report`, payload);
  }

  getUsersDropdown(): Observable<PartnerUserDropdownOption[]> {
    return this.http.get<PartnerUserDropdownOption[]>(`${this.baseUrl}/users/dropdown`);
  }
}
