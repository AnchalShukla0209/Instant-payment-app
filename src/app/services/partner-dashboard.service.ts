import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PartnerDashboard,
  PartnerWallet
} from '../models/partner-dashboard.model';

@Injectable({ providedIn: 'root' })
export class PartnerDashboardService {
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/partner/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getDashboard(days = 7): Observable<PartnerDashboard> {
    return this.http.get<PartnerDashboard>(this.baseUrl, {
      params: { days }
    });
  }

  getWallet(): Observable<PartnerWallet> {
    return this.http.get<PartnerWallet>(`${this.baseUrl}/wallet`);
  }
}
