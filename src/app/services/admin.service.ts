import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FinoDailyLoginResponse, JIODailyLoginResponse } from '../models/FinoDailyLoginResponse'
import { FinoAepsResponse } from '../models/FinoDailyLoginResponse'
import { FinoAepsRequest } from '../models/FinoDailyLoginResponse'
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})

export class AdminConfigService {

    private baseUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    toggleProvider(data: any) {
        return this.http.post(`${this.baseUrl}/master/provider/toggle`, data);
    }

    toggleFeature(data: any) {
        return this.http.post(`${this.baseUrl}/master/feature/toggle`, data);
    }

    toggleapiProvider(data: any) {
        return this.http.post(`${this.baseUrl}/master/apiprovider/toggle`, data);
    }

    toggleProviderFeature(data: any) {
        return this.http.post(`${this.baseUrl}/master/provider-feature/toggle`, data);
    }

    //providers

    getProviders(serviceCode: string) {
        return this.http.get<any[]>(`${this.baseUrl}/master/${serviceCode}/providers`);
    }

    getFeatures(serviceCode: string) {
        return this.http.get<any[]>(`${this.baseUrl}/master/${serviceCode}/features`);
    }

    getProviderFeatures(serviceCode: string, providerCode: string) {
        return this.http.get<any[]>(
            `${this.baseUrl}/master/${serviceCode}/${providerCode}/features`
        );
    }

    uploadApk(file: File, versionName: string, versionCode: string, releaseNotes: string) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('versionName', versionName);
        formData.append('versionCode', versionCode);
        formData.append('releaseNotes', releaseNotes);
        return this.http.post<any>(`${this.baseUrl}/AppRelease/upload`, formData);
    }

    getAppReleases(pageIndex: number = 1, pageSize: number = 10, commonsearch: string = '') {
        const params: any = { pageIndex, pageSize };
        if (commonsearch.trim()) params['commonsearch'] = commonsearch.trim();
        return this.http.get<any>(`${this.baseUrl}/AppRelease/list`, { params });
    }

    getLatestApkRelease() {
        return this.http.get<any>(`${this.baseUrl}/AppRelease/latest`);
    }

    broadcastWhatsApp(payload: { link: string; sendToActiveUsersOnly: boolean }) {
        return this.http.post<any>(`${this.baseUrl}/WhatsApp/broadcast`, payload);
    }
}