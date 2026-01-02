import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface District {
  SNo: number;
  StateCode: number;
  StateName: string;
  DistrictLGDCode: number;
  "DistrictName(InEnglish)": string;
  Hierarchy: string;
  ShortNameOfDistrict: string;
}

@Injectable({
  providedIn: 'root'
})
export class UpcityService {
  private jsonUrl = 'assets/UPStateCities/UPCity.json';
  constructor(private http: HttpClient) { }
  getDistricts(): Observable<District[]> {
    return this.http.get<District[]>(this.jsonUrl);
  }
}