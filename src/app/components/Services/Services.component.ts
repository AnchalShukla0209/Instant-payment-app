import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal,NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../app-loader/loader.component';
import { ServiceApi } from '../../services/service.service';
import { ServiceDto, PagedResult } from '../../models/service.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [FormsModule, CommonModule, LoaderComponent,NgbTypeaheadModule, NgbToastModule],
  templateUrl: './Services.component.html',
  styleUrls: ['./Services.component.scss']
})
export class ServiceListComponent implements OnInit {
  services: ServiceDto[] = [];
  paginatedServices: ServiceDto[] = [];
  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  searchKeyword = '';
  isLoading = false;
  visiblePages: (number | null)[] = [];

  selectedService: ServiceDto = { serviceName: '', servicePath: '', isActive: true };
  isEditMode = false;
  @ViewChild('serviceModal') serviceModal: any;

  constructor(private api: ServiceApi, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.loadServices(this.currentPage, this.pageSize);
  }

  loadServices(pageIndex: number, pageSize: number): void {
    this.isLoading = true;
    this.api.getServices(pageIndex, pageSize).subscribe({
      next: (res: PagedResult<ServiceDto>) => {
        this.services = res.items;
        this.totalRecords = res.totalCount;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = pageIndex;
        this.updateVisiblePages();
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
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
    this.paginatedServices = this.services.filter(s =>
      s.serviceName.toLowerCase().includes(keyword)
    );
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadServices(page, this.pageSize);
  }

  openModal(content: any, service?: ServiceDto): void {
    if (service) {
      this.selectedService = { ...service };
      this.isEditMode = true;
    } else {
      this.selectedService = { serviceName: '', servicePath: '', isActive: true };
      this.isEditMode = false;
    }
    this.modalService.open(this.serviceModal, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  saveService(modalRef: any): void {
    if (!this.selectedService.serviceName?.trim()) {
      Swal.fire('Validation', 'Service Name is mandatory', 'warning');
      return;
    }

    const action = this.isEditMode
      ? this.api.updateService(this.selectedService.id!, this.selectedService)
      : this.api.createService(this.selectedService);

    action.subscribe({
      next: () => {
        Swal.fire('Success', 'Service saved successfully', 'success');
        modalRef.close();
        this.loadServices(this.currentPage, this.pageSize);
      },
      error: (err) => {
        Swal.fire('Error', err.error.text || 'Something went wrong', 'error');
      }
    });
  }

  deleteService(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the service.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5e2f82',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.deleteService(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Service has been deleted.', 'success');
            this.loadServices(this.currentPage, this.pageSize);
          },
          error: () => Swal.fire('Error', 'Failed to delete service', 'error')
        });
      }
    });
  }
}
