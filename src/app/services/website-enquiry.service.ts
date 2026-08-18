import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WebsiteEnquiryRequest {
  fullName: string;
  mobile: string;
  email: string;
  interest: string;
  message?: string;
}

export interface WebsiteEnquiryResponse {
  success: boolean;
  message: string;
  enquiryId?: string;
}

@Injectable({ providedIn: 'root' })
export class WebsiteEnquiryService {
  private readonly endpoint = `${environment.apiBaseUrl}/WebsiteEnquiry`;

  constructor(private http: HttpClient) {}

  submit(request: WebsiteEnquiryRequest): Observable<WebsiteEnquiryResponse> {
    return this.http.post<WebsiteEnquiryResponse>(this.endpoint, request);
  }
}
