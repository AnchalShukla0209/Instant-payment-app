import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgbModal, NgbTypeaheadModule, NgbToastModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { CommissionService } from '../../services/commission.service';
import { SlabInfoDto, PagedResult, UpdateCommissionResult } from '../../models/commission.model';
import { LoaderComponent } from '../app-loader/loader.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
@Component({
    selector: 'app-margin-list',
    standalone: true,
    imports: [NgbTypeaheadModule, CommonModule, NgbToastModule, LoaderComponent, FormsModule],
    templateUrl: './margin.component.html',
    styleUrls: ['./margin.component.scss']
})

export class MarginList implements OnInit {

    totalRecords = 0;
    totalPages = 0;
    currentPage = 1;
    pageSize = 10;
    isLoading = false;
    mode = 'ALL';
    slabs: SlabInfoDto[] = [];
    paginatedslabs: SlabInfoDto[] = [];
    visiblePages: (number | null)[] = [];
    searchKeyword: string = '';

    constructor(private http: HttpClient, private toastr: ToastrService, private _CommissionService: CommissionService, private modalService: NgbModal) { }

    ngOnInit(): void {
        this.loadClientList(this.currentPage, this.pageSize, 'ALL',);
    }


    loadClientList(pageIndex: number, pageSize: number, mode?: string): void {
        this.isLoading = true;
        this.mode = mode ?? 'ALL';
        this._CommissionService.getMargin(this.mode, pageIndex, this.pageSize).subscribe((result: PagedResult<SlabInfoDto>) => {
            this.slabs = result.items;
            this.totalRecords = result.totalCount;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            this.currentPage = pageIndex;
            this.isLoading = false;
            this.updateVisiblePages();
            this.applyFilter();
        });

    }
    updateVisiblePages(): void {
        const pages: (number | null)[] = [];

        if (this.totalPages <= 7) {
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (this.currentPage > 4) {
                pages.push(null);
            }

            const start = Math.max(2, this.currentPage - 1);
            const end = Math.min(this.totalPages - 1, this.currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (this.currentPage < this.totalPages - 3) {
                pages.push(null);
            }

            pages.push(this.totalPages);
        }

        this.visiblePages = pages;
    }

    applyFilter(): void {
        this.isLoading = true;
        const keyword = this.searchKeyword.toLowerCase();
        this.paginatedslabs = this.slabs.filter(user =>
            user.serviceName?.toLowerCase().includes(keyword) ||
            user.ipShare.toString()?.toLowerCase().includes(keyword) ||
            user.slabName?.toLowerCase().includes(keyword) ||
            user.wlShare.toString()?.toLowerCase().includes(keyword)
        );
        this.isLoading = false;
    }

    changePage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.loadClientList(page, this.pageSize, 'ALL');
    }


    updateCommission(id: number): void {

        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you really want to update this commission?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, update it',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#5e2f82',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {

                this.isLoading = true;
                const ipShare = (document.getElementById(`txtIPShare${id}`) as HTMLInputElement)?.value;
                const wlShare = (document.getElementById(`txtWLShare${id}`) as HTMLInputElement)?.value;
                const commissionType = (document.getElementById(`ddlCommisionType${id}`) as HTMLSelectElement)?.value;
                console.log('Update:', { id, ipShare, wlShare, commissionType });
                const command = {
                    id: id,
                    ipShare: ipShare,
                    wlShare: wlShare,
                    commissionType: commissionType
                };

                this._CommissionService.updateCommission(command)
                    .subscribe((res: UpdateCommissionResult) => {
                        if (res.flag) {
                            Swal.fire({
                                title: 'Updated!',
                                text: res.errorMsg,
                                icon: 'success',
                                confirmButtonColor: '#5e2f82'
                            }).then(() => {
                                this.isLoading = false;
                                this.loadClientList(1, this.pageSize, 'ALL');
                                this.isLoading = false;
                            });
                            this.isLoading = false;
                        }
                        else {
                            Swal.fire({
                                title: 'Update Failed',
                                text: res.errorMsg,
                                icon: 'error',
                                confirmButtonColor: '#dc3545'
                            });
                            this.isLoading = false;
                        }
                        this.isLoading = false;

                    });
            }
        });
    }




}