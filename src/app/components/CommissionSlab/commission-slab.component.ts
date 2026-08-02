import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../app-loader/loader.component';
import { CommissionService } from '../../services/commission.service';
import {
  CommissionSlabDto,
  PlanDropdownDto,
  ServiceDropdownDto,
  OperatorDropdownDto,
  ApiCodeDropdownDto,
  CommissionSlabListResponse
} from '../../models/commission.model';

@Component({
  selector: 'app-commission-slab',
  standalone: true,
  imports: [FormsModule, CommonModule, LoaderComponent],
  templateUrl: './commission-slab.component.html',
  styleUrls: ['./commission-slab.component.scss']
})
export class CommissionSlabComponent implements OnInit {
  commissionSlabs: CommissionSlabDto[] = [];
  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  searchKeyword = '';
  isLoading = false;
  visiblePages: (number | null)[] = [];
  selectedRowIndex: number = -1;

  selectedSlab: CommissionSlabDto = {
    planId: 0,
    slabRange: '',
    adminShare: 0,
    wlAdminShare: 0,
    mdShare: 0,
    adShare: 0,
    rtShare: 0,
    commissionType: 'flat',
    serviceId: 0,
    apiCode: '',
    operatorId: 0,
    createdBy: 'System'
  };
  isEditMode = false;

  // Dropdown data
  planDropdown: PlanDropdownDto[] = [];
  serviceDropdown: ServiceDropdownDto[] = [];
  operatorDropdown: OperatorDropdownDto[] = [];
  apiCodeDropdown: ApiCodeDropdownDto[] = [];

  @ViewChild('slabModal') slabModal: any;

  constructor(private api: CommissionService, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.loadDropdowns();
    this.loadCommissionSlabs(this.currentPage, this.pageSize);
  }

  loadDropdowns(): void {
    this.api.getPlanDropdown().subscribe({
      next: (res) => {
        this.planDropdown = res.data;
      },
      error: (err) => {
        console.error('Error loading plans:', err);
      }
    });

    this.api.getServiceDropdown().subscribe({
      next: (res) => {
        this.serviceDropdown = res;
      },
      error: (err) => {
        console.error('Error loading services:', err);
      }
    });

    this.api.getApiCodeDropdown().subscribe({
      next: (res) => {
        this.apiCodeDropdown = res.data;
      },
      error: (err) => {
        console.error('Error loading API codes:', err);
      }
    });
  }

  loadOperators(serviceId: number): void {
    if (!serviceId) {
      this.operatorDropdown = [];
      this.selectedSlab.operatorId = 0;
      return;
    }
    this.api.getOperatorDropdown(serviceId).subscribe({
      next: (res) => {
        this.operatorDropdown = res;
      },
      error: (err) => {
        console.error('Error loading operators:', err);
        this.operatorDropdown = [];
      }
    });
  }

  loadCommissionSlabs(pageNumber: number, pageSize: number, search?: string): void {
    this.isLoading = true;
    this.api.getCommissionSlabList(pageNumber, pageSize, search).subscribe({
      next: (res: CommissionSlabListResponse) => {
        this.commissionSlabs = res.data;
        this.totalRecords = res.totalCount;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = res.pageNumber;
        this.updateVisiblePages();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire('Error', err.error?.message || 'Failed to load commission slabs', 'error');
      }
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

  onSearch(): void {
    this.currentPage = 1;
    this.loadCommissionSlabs(this.currentPage, this.pageSize, this.searchKeyword);
  }

  onSearchInput(): void {
    this.currentPage = 1;
    this.loadCommissionSlabs(this.currentPage, this.pageSize, this.searchKeyword);
  }

  resetSearch(): void {
    this.searchKeyword = '';
    this.currentPage = 1;
    this.loadCommissionSlabs(this.currentPage, this.pageSize);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadCommissionSlabs(page, this.pageSize, this.searchKeyword);
  }

  selectRow(index: number): void {
    this.selectedRowIndex = index;
  }

  openModal(content: any, slab?: CommissionSlabDto): void {
    if (slab) {
      this.selectedSlab = { ...slab };
      this.isEditMode = true;
      this.loadOperators(slab.serviceId);
    } else {
      this.selectedSlab = {
        planId: 0,
        slabRange: '',
        adminShare: 0,
        wlAdminShare: 0,
        mdShare: 0,
        adShare: 0,
        rtShare: 0,
        commissionType: 'flat',
        serviceId: 0,
        apiCode: '',
        operatorId: 0,
        createdBy: 'System'
      };
      this.isEditMode = false;
      this.operatorDropdown = [];
    }
    this.modalService.open(this.slabModal, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  onServiceChange(): void {
    this.selectedSlab.operatorId = 0;
    this.loadOperators(this.selectedSlab.serviceId);
  }

  saveSlab(modalRef: any): void {
    if (!this.validateSlab()) {
      return;
    }

    const action = this.isEditMode
      ? this.api.updateCommissionSlab(this.selectedSlab)
      : this.api.createCommissionSlab(this.selectedSlab);

    action.subscribe({
      next: (res: any) => {
        if (res.success === false) {
          Swal.fire('Error', res.message || 'Failed to save commission slab', 'error');
        } else {
          Swal.fire('Success', `Commission Slab ${this.isEditMode ? 'updated' : 'created'} successfully`, 'success');
          modalRef.close();
          this.loadCommissionSlabs(this.currentPage, this.pageSize, this.searchKeyword);
        }
      },
      error: (err) => {
        const errorMessage = err.error?.message || err.error?.text || 'Something went wrong';
        Swal.fire('Error', errorMessage, 'error');
      }
    });
  }

  validateSlab(): boolean {
    if (!this.selectedSlab.planId) {
      Swal.fire('Validation', 'Please select a plan', 'warning');
      return false;
    }
    if (!this.selectedSlab.slabRange?.trim()) {
      Swal.fire('Validation', 'Slab range is required', 'warning');
      return false;
    }
    if (!this.selectedSlab.serviceId) {
      Swal.fire('Validation', 'Please select a service', 'warning');
      return false;
    }
    if (!this.selectedSlab.apiCode?.trim()) {
      Swal.fire('Validation', 'Please select an API code', 'warning');
      return false;
    }
    if (!this.selectedSlab.commissionType?.trim()) {
      Swal.fire('Validation', 'Commission type is required', 'warning');
      return false;
    }
    if (this.selectedSlab.adminShare < 0 || this.selectedSlab.adminShare > 100) {
      Swal.fire('Validation', 'Admin share must be between 0 and 100', 'warning');
      return false;
    }
    if (this.selectedSlab.wlAdminShare < 0 || this.selectedSlab.wlAdminShare > 100) {
      Swal.fire('Validation', 'WL Admin share must be between 0 and 100', 'warning');
      return false;
    }
    if (this.selectedSlab.mdShare < 0 || this.selectedSlab.mdShare > 100) {
      Swal.fire('Validation', 'MD share must be between 0 and 100', 'warning');
      return false;
    }
    if (this.selectedSlab.adShare < 0 || this.selectedSlab.adShare > 100) {
      Swal.fire('Validation', 'AD share must be between 0 and 100', 'warning');
      return false;
    }
    if (this.selectedSlab.rtShare < 0 || this.selectedSlab.rtShare > 100) {
      Swal.fire('Validation', 'RT share must be between 0 and 100', 'warning');
      return false;
    }
    return true;
  }

  deleteSlab(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the commission slab.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5e2f82',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.deleteCommissionSlab(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Commission slab has been deleted successfully', 'success');
            this.loadCommissionSlabs(this.currentPage, this.pageSize, this.searchKeyword);
          },
          error: (err) => {
            const errorMessage = err.error?.message || err.error?.text || 'Failed to delete commission slab';
            Swal.fire('Error', errorMessage, 'error');
          }
        });
      }
    });
  }

  getPlanName(planId: number): string {
    const plan = this.planDropdown.find(p => p.id === planId);
    return plan ? plan.planName : 'Unknown';
  }

  getServiceName(serviceId: number): string {
    const service = this.serviceDropdown.find(s => s.id === serviceId);
    return service ? service.serviceName : 'Unknown';
  }

  getApiCodeName(apiCode: string): string {
    const code = this.apiCodeDropdown.find(c => c.apiCodeValue === apiCode);
    return code ? code.name : apiCode;
  }
}
