import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceDto, PagedResult } from '../models/service.model';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ServiceApi {
  private baseUrl = `${environment.apiBaseUrl}/Services`;

  constructor(private http: HttpClient) {}

  getServices(pageIndex: number, pageSize: number): Observable<PagedResult<ServiceDto>> {
    return this.http.get<PagedResult<ServiceDto>>(`${this.baseUrl}/GetAllServices?pageIndex=${pageIndex}&pageSize=${pageSize}`);
  }

  getServiceById(id: number): Observable<ServiceDto> {
    return this.http.get<ServiceDto>(`${this.baseUrl}/${id}`);
  }

  createService(dto: ServiceDto): Observable<any> {
    return this.http.post(this.baseUrl, dto, { responseType: 'text' });
  }

  updateService(id: number, dto: ServiceDto): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, dto, { responseType: 'text' });
  }

  deleteService(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
