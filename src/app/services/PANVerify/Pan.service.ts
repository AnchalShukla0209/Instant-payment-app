import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PanVerifyResponse } from '../../models/PANVerify/PanVerifyResponse.model';

@Injectable({ providedIn: 'root' })
export class PanService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/pan/verify`;

   verifyPan(panNumber: string): Observable<PanVerifyResponse> {
    const params = new HttpParams().set('panNumber', panNumber);
    return this.http.get<PanVerifyResponse>(this.apiUrl, { params });
  }
}
