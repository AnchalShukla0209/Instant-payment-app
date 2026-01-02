import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service';
import { environment } from '../../environments/environment';
import { RechargePlanResponse } from '../../app/models/RechargePlan'

export interface UserMasterDataForDD {
  id: number;
  name: string;
}

export interface ServiceStatusResponse {
  userServiceActive: boolean;
  serviceActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class MasterService {

  private apiUrl = `${environment.apiBaseUrl}`;
  private baseurlforplan = 'https://www.mplan.in/api/plans.php';
  private apikey = '3a527a8f2b21e286edd52ea46424b287';


  constructor(private http: HttpClient, private encryptor: EncryptionService, ) { }

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`).pipe(
      map(res => this.encryptor.decrypt(res.data))
    );
  }

  getUsers(mode: string = ''): Observable<UserMasterDataForDD[]> {
    return this.http.post<UserMasterDataForDD[]>((`${this.apiUrl}/Master/MasterUserDataForDD`), null, {
      params: { mode }
    });
  }

  checkServiceStatus(mode: string, userId: number): Observable<ServiceStatusResponse> {
    return this.http.post<ServiceStatusResponse>(`${this.apiUrl}/Master/CheckServiceStatus`, null, {
      params: { Mode: mode, UserId: userId }
    });
  }

  PlanForMobile(request: any): Observable<RechargePlanResponse> {
    return this.http.post<RechargePlanResponse>(`${this.apiUrl}/Master/RechargePlans`, request);
  }

  PlanForMobileV2(request: any): Observable<RechargePlanResponse> {
    const params = new HttpParams()
      .set('apikey', this.apikey)
      .set('offer', request.offer)
      .set('tel', request.tel)
      .set('operator', request.operatorName);

    return this.http.post<RechargePlanResponse>(this.baseurlforplan, {}, { params });
  }


}
