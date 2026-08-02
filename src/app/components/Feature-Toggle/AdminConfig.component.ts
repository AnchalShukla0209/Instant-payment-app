import { Component, signal, ViewChild, inject, NgZone, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../app-loader/loader.component';
import { AuthService } from '../../services/auth.service';
import { MasterService } from '../../services/master.service';
import { AdminConfigService } from '../../services/admin.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { AdminFeature, AdminProvider } from '../../models/AdminFeature'

@Component({
    selector: 'app-adminconfig',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, NgbTypeaheadModule, NgbToastModule, LoaderComponent, NgSelectModule],
    templateUrl: './AdminConfig.component.html',
    styleUrls: ['./AdminConfig.component.scss']
})
export class AdminConfigComponent {
    constructor(private modalService: NgbModal, private toastr: ToastrService, private masterService: MasterService, private adminApi: AdminConfigService) { }
    services = ['AEPS', 'DMT', 'BILLPAY'];
    selectedService!: string;
    selectedProvider: string | null = null;
    selectedProviderEnabled = true;
    providers: AdminProvider[] = [];
    features: AdminFeature[] = [];
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
            .subscribe(res => this.providers = res);
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




}
