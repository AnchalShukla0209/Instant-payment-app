// money-transfer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FinoDailyLoginResponse, JIODailyLoginResponse } from '../models/FinoDailyLoginResponse'
import { FinoAepsResponse } from '../models/FinoDailyLoginResponse'
import { FinoAepsRequest, FinoMerchantEKYCRequest } from '../models/FinoDailyLoginResponse'
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AEPSService {
    private baseUrl = 'https://instantpayment.co.in/api';
    //private DAILY_LOGIN_URL = "https://instantpayment.co.in/api/AepsDailyLogin";
    private DAILY_LOGIN_URL = environment.apiBaseUrl+"/FinoAEPS/DailyLoginCheck";
    //private FINO_AEPS_URL = "https://instantpayment.co.in/api/FinoAEPS";
    private FINO_AEPS_URL = environment.apiBaseUrl+"/FinoAEPS";
    private State_URL = "https://liveapi.in/geo/state/?country=IN";
    private JPB_AEPS_URL = environment.apiBaseUrl;
    //private FINO_EKYC_URL = "https://instantpayment.co.in/api/FinoMerchantReg";
    private FINO_EKYC_URL = environment.apiBaseUrl+"/FinoAEPS/MerchantEkyc";

    constructor(private http: HttpClient) { }

    // 1. Check if Sender Exists
    checkDailyLogin(sessionKey: string): Observable<FinoDailyLoginResponse> {
        return this.http.post<FinoDailyLoginResponse>(this.DAILY_LOGIN_URL, {
            SessionKey: sessionKey,
            APIKey: "DailyLogin01"
        });
    }

    finoLogin(payload: FinoAepsRequest): Observable<FinoAepsResponse> {
        return this.http.post<FinoAepsResponse>(this.FINO_AEPS_URL, payload);
    }

    checkDailyLoginJPB(): Observable<JIODailyLoginResponse> {
        const url = this.JPB_AEPS_URL + "/AEPS/CheckAgentDailyLogin";
        return this.http.get<JIODailyLoginResponse>(url);
    }

    agentStatus(agentId: string, mob: string, aadhar: string): Observable<JIODailyLoginResponse> {
        const url =
            this.JPB_AEPS_URL +
            "/AEPS/agentstatus?agentId=" +
            agentId +
            "&mob=" +
            mob +
            "&aadharnumber=" +
            aadhar;

        return this.http.get<JIODailyLoginResponse>(url);
    }

    createAgent(request: any): Observable<any> {
        return this.http.post(`${this.JPB_AEPS_URL}/AEPS/createAgent`, request);
    }

    agentEKYC(request: any): Observable<any> {
        return this.http.post(`${this.JPB_AEPS_URL}/AEPS/AgentEKYC`, request);
    }

    StateList(): Observable<any> {
        return this.http.get(`${this.State_URL}`);
    }

    jpbBalanceEnquiry(request: any): Observable<any> {
        return this.http.post(`${this.JPB_AEPS_URL}/AEPS/JPBBalanceEnquiry`, request);
    }

    jpbCashWithdrawal(request: any): Observable<any> {
        return this.http.post(`${this.JPB_AEPS_URL}/AEPS/JPBCashWithdrawal`, request);
    }

    jpbCashDeposit(request: any): Observable<any> {
        return this.http.post(`${this.JPB_AEPS_URL}/AEPS/JPBCashDeposit`, request);
    }

    jpbMiniStatement(request: any): Observable<any> {
        return this.http.post(`${this.JPB_AEPS_URL}/AEPS/JPBMiniStatement`, request);
    }

    finoMerchantEKYC(payload: FinoMerchantEKYCRequest) {
        return this.http.post<FinoAepsResponse>(this.FINO_EKYC_URL, payload);
    }

    checkTransactionStatus(payload: any): Observable<any> {
        return this.http.post(`${this.FINO_AEPS_URL}/TransactionStatus`, payload);
    }
}

