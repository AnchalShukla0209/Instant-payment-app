import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BankDto, PagedResult } from '../models/BankDto';
import { BankModel } from '../models/BankModel';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BankService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/Bank`;
  private AEPSBankapiUrl = 'https://instantpayment.co.in/api/DMTBankList';

  getAll(pageNumber: number = 1, pageSize: number = 10): Observable<PagedResult<BankDto>> {
    return this.http.get<PagedResult<BankDto>>(`${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`);
  }

  getAllActive(): Observable<BankDto[]> {
    return this.http.get<BankDto[]>(`${this.apiUrl}/active`);
  }

  getById(id: string): Observable<BankDto> {
    return this.http.get<BankDto>(`${this.apiUrl}/${id}`);
  }

  create(bank: BankDto): Observable<any> {
    return this.http.post(this.apiUrl, bank);
  }

  update(id: string, bank: BankDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, bank);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getBankList() {
    const payload = { Stype: 'BANKLIST' };

    return this.http.post<any>('https://instantpayment.co.in/api/DMTBankList', payload).pipe(
      map(res => res.Data.map((b: any) => this.mapToBankModel(b)))
    );
  }

  getBankListForJPB() {
    return this.http.get<any>(this.apiUrl+'/BankListForJPB').pipe(
      map(res => res.data.map((b: any) => this.mapToBankModelJPB(b)))
    );
  }

  private mapToBankModel(item: any): BankModel {
    return {
      id: item.Id,
      bankName: item.BankName,
      nbin: item.NBIN,
      status: item.Status
    };
  }

  private mapToBankModelJPB(item: any): BankModel {
    return {
      id: item.nbin,
      bankName: item.bankName,
      nbin: item.nbin,
      status: item.bankName
    };
  }
}
