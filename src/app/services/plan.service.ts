import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PlanDto, PlanListResponse, PlanResponse, DeleteResponse, PagedResult } from '../models/plan.model';

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private apiUrl = `${environment.apiBaseUrl}/CommissionPlan/plan`;

  constructor(private http: HttpClient) {}

  createPlan(plan: PlanDto): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(`${this.apiUrl}/create`, plan);
  }

  updatePlan(plan: PlanDto): Observable<PlanResponse> {
    return this.http.put<PlanResponse>(`${this.apiUrl}/update`, plan);
  }

  getPlan(id: number): Observable<PlanResponse> {
    return this.http.get<PlanResponse>(`${this.apiUrl}/${id}`);
  }

  deletePlan(id: number): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/${id}`);
  }

  getPlanList(pageNumber: number, pageSize: number, search?: string): Observable<PlanListResponse> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PlanListResponse>(`${this.apiUrl}/list`, { params });
  }
}
