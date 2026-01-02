import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class IQoreService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // 🔹 Bill Fetch API
  fetchBill(data: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/IQore/Billfetch`,
      data
    );
  }

  // 🔹 Insurance Fetch API
  fetchInsurance(data: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/IQore/fetch`,
      data
    );
  }
}