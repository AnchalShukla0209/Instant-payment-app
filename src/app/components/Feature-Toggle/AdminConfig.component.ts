import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AdminConfigService } from '../../services/admin.service';
import { AdminFeature, AdminProvider } from '../../models/AdminFeature'

@Component({
    selector: 'app-adminconfig',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './AdminConfig.component.html',
    styleUrls: ['./AdminConfig.component.scss']
})
export class AdminConfigComponent {
    constructor(private toastr: ToastrService, private adminApi: AdminConfigService) { }
    services = ['AEPS', 'DMT', 'BILLPAY', 'SETTLEMENT'];
    selectedService!: string;
    selectedProvider: string | null = null;
    selectedProviderEnabled = true;
    providers: AdminProvider[] = [];
    features: AdminFeature[] = [];
    switchingProvider: string | null = null;

    get isSettlement(): boolean {
        return this.selectedService === 'SETTLEMENT';
    }
    onServiceChange() {
        this.selectedProvider = null;
        this.features = [];
        this.loadProviders();
    }

    loadProviders() {
        if (!this.selectedService || this.selectedService === 'BILLPAY') {
            this.providers = [];
            this.loadFeatures();
            return;
        }

        this.adminApi.getProviders(this.selectedService)
            .subscribe({
                next: res => {
                    this.providers = res;
                    this.loadFeatures();
                },
                error: () => this.toastr.error('Unable to load providers')
            });
    }


    onProviderChange() {
        const provider = this.providers.find(p => p.key === this.selectedProvider);
        this.selectedProviderEnabled = provider?.isEnabled ?? false;
        this.loadFeatures();
    }

    loadFeatures() {

        // Provider selected → provider features
        if (this.selectedService && this.selectedProvider) {
            this.adminApi
                .getProviderFeatures(this.selectedService, this.selectedProvider)
                .subscribe(res => this.mapFeatures(res));
            return;
        }

        // BILLPAY → features only
        if (this.selectedService === 'BILLPAY') {
            this.adminApi
                .getFeatures(this.selectedService)
                .subscribe(res => this.mapFeatures(res));
            return;
        }

        // No provider selected → show providers as rows
        this.features = this.providers.map(p => ({
            key: p.key,
            label: p.label,
            icon: 'bi-fingerprint',
            isEnabled: p.isEnabled,
            providerCode:''
        }));
    }


    mapFeatures(data: any[]) {
        this.features = data.map(x => ({
            key: x.key,
            label: x.label,
            icon: x.icon,
            isEnabled: x.isEnabled,
            providerCode:''
        }));
    }

    toggleFeature(row: AdminFeature, checked: boolean) {

        row.isEnabled = checked;

        // 🔹 Provider toggle (AEPS / DMT)
        if (this.selectedService && !this.selectedProvider && this.selectedService !== 'BILLPAY') {

            this.adminApi.toggleapiProvider({
                serviceCode: this.selectedService,
                providerCode: row.key,
                isEnabled: checked
            }).subscribe();

            return;
        }

        // 🔹 Provider feature toggle
        if (this.selectedProvider) {

            if (!this.selectedProviderEnabled) {
                this.toastr.error('Provider is disabled');
                return;
            }

            this.adminApi.toggleProviderFeature({
                serviceCode: this.selectedService,
                providerCode: this.selectedProvider,
                featureCode: row.key,
                isEnabled: checked
            }).subscribe();

            return;
        }

        // 🔹 Global feature toggle (BILLPAY)
        this.adminApi.toggleFeature({
            serviceCode: this.selectedService,
            featureCode: row.key,
            isEnabled: checked
        }).subscribe();
    }

    selectSettlementProvider(provider: AdminProvider): void {
        if (provider.isEnabled || this.switchingProvider) return;

        this.switchingProvider = provider.key;
        this.adminApi.toggleapiProvider({
            serviceCode: 'SETTLEMENT',
            providerCode: provider.key,
            isEnabled: true
        }).subscribe({
            next: () => {
                this.providers = this.providers.map(item => ({
                    ...item,
                    isEnabled: item.key === provider.key
                }));
                this.features = this.providers.map(item => ({
                    key: item.key,
                    label: item.label,
                    icon: item.key === 'RBL' ? 'bi-bank2' : 'bi-lightning-charge',
                    isEnabled: item.isEnabled,
                    providerCode: ''
                }));
                this.switchingProvider = null;
                this.toastr.success(`${provider.label} is now handling settlements`);
            },
            error: () => {
                this.switchingProvider = null;
                this.toastr.error('Settlement provider could not be changed');
            }
        });
    }




}
