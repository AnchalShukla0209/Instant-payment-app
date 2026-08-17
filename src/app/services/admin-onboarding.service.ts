import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({providedIn:'root'})
export class AdminOnboardingService {
  private readonly base=`${environment.apiBaseUrl}/v1/admin/onboardings`;
  constructor(private http:HttpClient){}
  list(f:any){let p=new HttpParams().set('pageIndex',f.pageIndex).set('pageSize',f.pageSize);['search','status','fromDate','toDate','salesTeamId'].forEach(k=>{if(f[k]!==undefined&&f[k]!==null&&f[k]!=='')p=p.set(k,f[k]);});return this.http.get<any>(this.base,{params:p});}
  detail(id:number){return this.http.get<any>(`${this.base}/${id}`);}
  salesPeople(){return this.http.get<any>(`${environment.apiBaseUrl}/UserDropdown/st`);}
  decideField(userId:number,id:number,status:string,remarks:string){return this.http.put<any>(`${this.base}/${userId}/fields/${id}`,{status,remarks});}
  decideDocument(userId:number,id:number,status:string,remarks:string){return this.http.put<any>(`${this.base}/${userId}/documents/${id}`,{status,remarks});}
  reject(userId:number,remarks:string){return this.http.post<any>(`${this.base}/${userId}/reject`,{remarks});}
  approve(userId:number,rowVersion:string){return this.http.post<any>(`${this.base}/${userId}/approve`,JSON.stringify(rowVersion),{headers:{'Content-Type':'application/json'}});}
  document(userId:number,id:number){return this.http.get(`${this.base}/${userId}/documents/${id}/file`,{responseType:'blob'});}
  documentVersion(userId:number,id:number){return this.http.get(`${this.base}/${userId}/document-versions/${id}/file`,{responseType:'blob'});}
  retryCredentialEmail(userId:number){return this.http.post<any>(`${this.base}/${userId}/retry-credential-email`,{});}
}
