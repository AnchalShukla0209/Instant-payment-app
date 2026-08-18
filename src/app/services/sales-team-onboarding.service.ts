import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type OnboardingStatus = 'Draft' | 'PendingReview' | 'Rejected' | 'PendingReReview' | 'Approved';
export interface OnboardingListItem { userId:number; name:string; username:string; phone:string; emailId:string; userType:string; panCard:string; aadhaarMasked:string; onboardingStatus:OnboardingStatus; createdAt?:string; updatedAt?:string; }
export interface OnboardingPage { data:OnboardingListItem[]; totalCount:number; pageIndex:number; pageSize:number; }
export interface ApiEnvelope<T> { success:boolean; data:T; message?:string; }
export interface OnboardingFilters { pageIndex:number; pageSize:number; search?:string; status?:string; fromDate?:string; toDate?:string; }
export interface SalesTeamHierarchyContext { id:number; name:string; username:string; phone:string; userType:'WL'; }

@Injectable({ providedIn: 'root' })
export class SalesTeamOnboardingService {
  private readonly baseUrl = `${environment.apiBaseUrl}/v1/sales-team/onboardings`;
  constructor(private readonly http: HttpClient) {}
  hierarchyContext(): Observable<ApiEnvelope<SalesTeamHierarchyContext>> { return this.http.get<ApiEnvelope<SalesTeamHierarchyContext>>(`${this.baseUrl}/hierarchy-context`); }
  list(filters: OnboardingFilters): Observable<ApiEnvelope<OnboardingPage>> {
    let params = new HttpParams().set('pageIndex', filters.pageIndex).set('pageSize', filters.pageSize);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters.toDate) params = params.set('toDate', filters.toDate);
    return this.http.get<ApiEnvelope<OnboardingPage>>(this.baseUrl, { params });
  }
  saveDraft(payload: unknown): Observable<ApiEnvelope<{userId:number;onboardingStatus:string;version:number;rowVersion:string}>> { return this.http.post<any>(`${this.baseUrl}/draft`, payload); }
  resume(phone: string): Observable<ApiEnvelope<any>> { return this.http.get<ApiEnvelope<any>>(`${this.baseUrl}/resume-by-phone`, { params: { phone } }); }
  uploadDocument(userId:number, type:string, file:File, correctionRemarks=''): Observable<ApiEnvelope<any>> { const body = new FormData(); body.append('file', file); body.append('correctionRemarks', correctionRemarks); return this.http.post<ApiEnvelope<any>>(`${this.baseUrl}/${userId}/documents/${type}`, body); }
  detail(userId:number): Observable<ApiEnvelope<any>> { return this.http.get<ApiEnvelope<any>>(`${this.baseUrl}/${userId}`); }
  submit(userId:number, rowVersion:string): Observable<ApiEnvelope<any>> { return this.http.post<ApiEnvelope<any>>(`${this.baseUrl}/${userId}/submit`, { rowVersion }); }
  sendOtp(type:'phone'|'email',value:string,clientId:number){return this.http.post<any>(`${this.baseUrl}/send-${type}-otp`,{value,clientId});}
  verifyOtp(challengeId:string,otp:string,type:'phone'|'email',clientId:number){return this.http.post<any>(`${this.baseUrl}/verify-otp`,{challengeId,otp,type,clientId});}
  verifyPan(panNumber:string,clientId:number){return this.http.post<any>(`${this.baseUrl}/verify-pan`,{panNumber,clientId});}
  verifyAadhaar(aadharNumber:string,clientId:number){return this.http.post<any>(`${this.baseUrl}/verify-aadhaar`,{aadharNumber,clientId});}
  document(userId:number,id:number){return this.http.get(`${this.baseUrl}/${userId}/documents/${id}/file`,{responseType:'blob'});}
  documentVersion(userId:number,id:number){return this.http.get(`${this.baseUrl}/${userId}/document-versions/${id}/file`,{responseType:'blob'});}
}
