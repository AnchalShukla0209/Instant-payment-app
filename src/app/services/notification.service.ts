import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificationDto {
    id?: number;
    content: string;
    status: 'Active' | 'Inactive';
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

   
    private baseUrl = `${environment.apiBaseUrl}/Notification`;

    constructor(private http: HttpClient) { }

    getNotifications(pageIndex: number, pageSize: number): Observable<PagedResult<NotificationDto>> {
        return this.http.get<PagedResult<NotificationDto>>(`${this.baseUrl}/GetAllNotification?pageIndex=${pageIndex}&pageSize=${pageSize}`);
    }

    getNotification(id: number): Observable<NotificationDto> {
        return this.http.get<NotificationDto>(`${this.baseUrl}/${id}`);
    }

    createNotification(dto: NotificationDto): Observable<any> {
        return this.http.post(this.baseUrl, dto);
    }

    updateNotification(id: number, dto: NotificationDto): Observable<any> {
        return this.http.put(`${this.baseUrl}/${id}`, dto);
    }
}
