import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WebsiteInfo {
  wlid: number;
  domain: string;
  logoUrl: string;
  companyName: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebsiteInfoService {
  private apiUrl = `${environment.apiBaseUrl}/WebsiteInfo`;

  constructor(private http: HttpClient) { }

  getWebsiteInfo(): Observable<WebsiteInfo | null> {
    const headers = new HttpHeaders({
      'Host': window.location.host,
      'X-Forwarded-Host': window.location.host
    });

    return this.http.get<{ data: WebsiteInfo }>(`${this.apiUrl}/get-info`, { headers }).pipe(
      map((res: any) => {
        if (res?.data) {
          this.setWlidInLocalStorage(res.data.wlid);
          return res.data as WebsiteInfo;
        }
        return null;
      })
    );
  }

  private setWlidInLocalStorage(wlid: number): void {
    localStorage.setItem('wlid', String(wlid));
  }

  getWlidFromLocalStorage(): number | null {
    const wlid = localStorage.getItem('wlid');
    return wlid ? parseInt(wlid, 10) : null;
  }
}
