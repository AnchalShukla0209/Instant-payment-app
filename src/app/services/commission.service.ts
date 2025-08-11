import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult, SlabInfoDto } from '../models/commission.model';
import { UpdateCommissionResult } from '../models/commission.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommissionService {


    private apiUrl = `${environment.apiBaseUrl}`;

 constructor(private http: HttpClient) {}

  getMargin(serviceName?: string, pageIndex = 1, pageSize = 50): Observable<PagedResult<SlabInfoDto>> {
    let params = new HttpParams()
      .set('pageIndex', pageIndex)
      .set('pageSize', pageSize);

    if (serviceName) {
      params = params.set('serviceName', serviceName);
    }

    return this.http.get<PagedResult<SlabInfoDto>>(`${this.apiUrl}/Slabs/GetMargin`, { params });
  }

  updateCommission(command: any): Observable<UpdateCommissionResult> {
    return this.http.post<UpdateCommissionResult>(`${this.apiUrl}/Slabs/update`, command);
  }
}
