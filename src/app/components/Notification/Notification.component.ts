import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal,NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { NotificationService, NotificationDto, PagedResult } from '../../services/notification.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../app-loader/loader.component';


@Component({
    selector: 'app-notification-list',
    standalone: true,
    imports: [FormsModule, CommonModule,  NgbTypeaheadModule, NgbToastModule, LoaderComponent],
    templateUrl: './notification.component.html',
    styleUrls: ['./notification.component.scss']
})
export class NotificationList implements OnInit {

    notifications: NotificationDto[] = [];
    paginatedNotifications: NotificationDto[] = [];
    totalRecords = 0;
    totalPages = 0;
    currentPage = 1;
    pageSize = 10;
    searchKeyword = '';
    isLoading = false;
    visiblePages: (number | null)[] = [];

    selectedNotification: NotificationDto = { content: '', status: 'Active' };
    isEditMode = false;
    @ViewChild('notificationModal') previewnotificationModal: any;
    constructor(private service: NotificationService, private modalService: NgbModal) { }

    ngOnInit(): void {
        this.loadNotifications(this.currentPage, this.pageSize);
    }

    loadNotifications(pageIndex: number, pageSize: number): void {
        this.isLoading = true;
        this.service.getNotifications(pageIndex, pageSize).subscribe((res: PagedResult<NotificationDto>) => {
            this.notifications = res.items;
            this.totalRecords = res.totalCount;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            this.currentPage = pageIndex;
            this.updateVisiblePages();
            this.applyFilter();
            this.isLoading = false;
        }, () => this.isLoading = false);
    }

    updateVisiblePages(): void {
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

    applyFilter(): void {
        const keyword = this.searchKeyword.toLowerCase();
        this.paginatedNotifications = this.notifications.filter(n =>
            n.content.toLowerCase().includes(keyword) || n.status.toLowerCase().includes(keyword)
        );
    }

    changePage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.loadNotifications(page, this.pageSize);
    }

    openModal(content: any, notification?: NotificationDto): void {
        if (notification) {
            this.selectedNotification = { ...notification };
            this.isEditMode = true;
        } else {
            this.selectedNotification = { content: '', status: 'Active' };
            this.isEditMode = false;
        }
        this.modalService.open(this.previewnotificationModal, { size: 'lg', backdrop: 'static',  keyboard: false });
    }

    saveNotification(modalRef: any): void {
        if (!this.selectedNotification.content?.trim()) {
            Swal.fire('Validation', 'Notification Content is mandatory', 'warning');
            return;
        }

        const action = this.isEditMode
            ? this.service.updateNotification(this.selectedNotification.id!, this.selectedNotification)
            : this.service.createNotification(this.selectedNotification);

        action.subscribe({
            next: () => {
                Swal.fire('Success', 'Notification saved successfully', 'success');
                modalRef.close();
                this.loadNotifications(this.currentPage, this.pageSize);
            },
            error: (err) => {
                Swal.fire('Error', err.error.text || 'Something went wrong', 'error');
            }
        });
    }
}
