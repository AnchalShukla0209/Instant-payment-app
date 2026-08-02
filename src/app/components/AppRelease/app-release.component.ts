import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AdminConfigService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../app-loader/loader.component';

@Component({
    selector: 'app-release',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    templateUrl: './app-release.component.html',
    styleUrls: ['./app-release.component.scss']
})
export class AppReleaseComponent implements OnInit {

    isLoading = false;
    isAdmin = false;

    versionName = '';
    versionCode = '';
    releaseNotes = '';
    selectedFile: File | null = null;
    selectedFileName = '';
    selectedFileSize = '';

    isDragOver = false;
    uploadResult: { versionName: string; versionCode: number; downloadUrl: string } | null = null;
    urlCopied = false;

    releases: any[] = [];
    releasesLoading = false;
    totalCount = 0;
    totalPages = 0;
    currentPage = 1;
    pageSize = 10;
    searchKeyword = '';
    visiblePages: (number | null)[] = [];
    copiedRowId: number | null = null;
    private searchTimer: any = null;

    constructor(
        private adminApi: AdminConfigService,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const usertype = this.authService.getUsertype();
        if (usertype !== 'SuperAdmin') {
            this.router.navigate(['/forbidden']);
            return;
        }
        this.isAdmin = true;
        this.loadReleases();
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = true;
    }

    onDragLeave(): void {
        this.isDragOver = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = false;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.processFile(files[0]);
        }
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.processFile(input.files[0]);
        }
    }

    private processFile(file: File): void {
        if (!file.name.toLowerCase().endsWith('.apk')) {
            Swal.fire({ icon: 'warning', title: 'Invalid File', text: 'Only .apk files are allowed.' });
            return;
        }
        this.selectedFile = file;
        this.selectedFileName = file.name;
        this.selectedFileSize = this.formatFileSize(file.size);
        this.uploadResult = null;
    }

    private formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    upload(): void {
        if (!this.versionName.trim()) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Version Name is required.' });
            return;
        }
        if (!this.versionCode.trim()) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Version Code is required.' });
            return;
        }
        if (!this.releaseNotes.trim()) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Release Notes are required.' });
            return;
        }
        if (!this.selectedFile) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Please select an APK file to upload.' });
            return;
        }

        this.isLoading = true;
        this.uploadResult = null;

        this.adminApi.uploadApk(this.selectedFile, this.versionName, this.versionCode, this.releaseNotes)
            .subscribe({
                next: (res: any) => {
                    this.isLoading = false;
                    if (res?.success && res?.data) {
                        this.uploadResult = res.data;
                        this.resetForm();
                        this.loadReleases();
                    } else {
                        Swal.fire({ icon: 'error', title: 'Upload Failed', text: res?.message || 'Unexpected response from server.' });
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    Swal.fire({ icon: 'error', title: 'Upload Failed', text: err?.error?.message || 'Something went wrong. Please try again.' });
                }
            });
    }

    copyDownloadUrl(): void {
        if (!this.uploadResult?.downloadUrl) return;
        navigator.clipboard.writeText(this.uploadResult.downloadUrl).then(() => {
            this.urlCopied = true;
            setTimeout(() => (this.urlCopied = false), 2500);
        });
    }

    onSearchChange(): void {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.currentPage = 1;
            this.loadReleases();
        }, 400);
    }

    changePage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadReleases();
    }

    copyRowUrl(release: any): void {
        if (!release?.downloadUrl) return;
        navigator.clipboard.writeText(release.downloadUrl).then(() => {
            this.copiedRowId = release.id;
            setTimeout(() => (this.copiedRowId = null), 2500);
        });
    }

    formatBytes(bytes: number): string {
        if (!bytes) return '—';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    loadReleases(): void {
        this.releasesLoading = true;
        this.adminApi.getAppReleases(this.currentPage, this.pageSize, this.searchKeyword).subscribe({
            next: (res) => {
                this.releases = res?.data || [];
                this.totalCount = res?.totalCount || 0;
                this.totalPages = res?.totalPages || 0;
                this.currentPage = res?.pageIndex || 1;
                this.updateVisiblePages();
                this.releasesLoading = false;
            },
            error: () => {
                this.releases = [];
                this.totalCount = 0;
                this.totalPages = 0;
                this.releasesLoading = false;
            }
        });
    }

    private updateVisiblePages(): void {
        const pages: (number | null)[] = [];
        if (this.totalPages <= 7) {
            for (let i = 1; i <= this.totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (this.currentPage > 4) pages.push(null);
            const start = Math.max(2, this.currentPage - 1);
            const end = Math.min(this.totalPages - 1, this.currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (this.currentPage < this.totalPages - 3) pages.push(null);
            pages.push(this.totalPages);
        }
        this.visiblePages = pages;
    }

    private resetForm(): void {
        this.versionName = '';
        this.versionCode = '';
        this.releaseNotes = '';
        this.selectedFile = null;
        this.selectedFileName = '';
        this.selectedFileSize = '';
        const fileInput = document.getElementById('apkFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
}
