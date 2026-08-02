import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettlementService {
  private baseUrl = 'https://api.instantpayment.co.in/api';

  constructor(private http: HttpClient) { }

  // Get Settlement Data
  getSettlementData(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/Settlement?userId=${userId}`);
  }

  // Withdraw Amount
  withdraw(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Settlement/withdraw`, payload);
  }

  // Get Location for API calls
  getLocation(): Promise<{ latitude: string; longitude: string }> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude.toString(),
              longitude: pos.coords.longitude.toString()
            });
          },
          (err) => {
            console.error('Geolocation error:', err);
            resolve({
              latitude: '28.6130176',
              longitude: '77.2308992'
            });
          }
        );
      } else {
        resolve({
          latitude: '28.6130176',
          longitude: '77.2308992'
        });
      }
    });
  }

}
