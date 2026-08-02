import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult, SlabInfoDto } from '../models/commission.model';
import { UpdateCommissionResult } from '../models/commission.model';
import {
  CommissionSlabDto,
  PlanDropdownResponse,
  ServiceDropdownDto,
  OperatorDropdownDto,
  ApiCodeDropdownResponse,
  CommissionSlabResponse,
  CommissionSlabListResponse,
  CommissionSlabDeleteResponse
} from '../models/commission.model';
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

  // Commission Slab APIs
  getPlanDropdown(): Observable<PlanDropdownResponse> {
    return this.http.get<PlanDropdownResponse>(`${this.apiUrl}/CommissionPlan/plan/dropdown`);
  }

  getServiceDropdown(): Observable<ServiceDropdownDto[]> {
    return this.http.get<ServiceDropdownDto[]>(`${this.apiUrl}/Services/dropdown`);
  }

  getOperatorDropdown(serviceId: number): Observable<OperatorDropdownDto[]> {
    return this.http.get<OperatorDropdownDto[]>(`${this.apiUrl}/Operator/dropdown/${serviceId}`);
  }

  getApiCodeDropdown(): Observable<ApiCodeDropdownResponse> {
    return this.http.get<ApiCodeDropdownResponse>(`${this.apiUrl}/APICode/dropdown`);
  }

  createCommissionSlab(slab: CommissionSlabDto): Observable<CommissionSlabResponse> {
    return this.http.post<CommissionSlabResponse>(`${this.apiUrl}/CommissionPlan/create`, slab);
  }

  updateCommissionSlab(slab: CommissionSlabDto): Observable<CommissionSlabResponse> {
    return this.http.put<CommissionSlabResponse>(`${this.apiUrl}/CommissionPlan/update`, slab);
  }

  getCommissionSlab(id: number): Observable<CommissionSlabResponse> {
    return this.http.get<CommissionSlabResponse>(`${this.apiUrl}/CommissionPlan/${id}`);
  }

  getCommissionSlabList(pageNumber: number, pageSize: number, search?: string): Observable<CommissionSlabListResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<CommissionSlabListResponse>(`${this.apiUrl}/CommissionPlan/list`, { params });
  }

  deleteCommissionSlab(id: number): Observable<CommissionSlabDeleteResponse> {
    return this.http.delete<CommissionSlabDeleteResponse>(`${this.apiUrl}/CommissionPlan/${id}`);
  }
}
