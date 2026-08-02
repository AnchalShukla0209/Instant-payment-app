import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../app-loader/loader.component';
import { PlanService } from '../../services/plan.service';
import { PlanDto, PlanListResponse } from '../../models/plan.model';

@Component({
  selector: 'app-plan-management',
  standalone: true,
  imports: [FormsModule, CommonModule, LoaderComponent, NgbTypeaheadModule, NgbToastModule],
  templateUrl: './plan-management.component.html',
  styleUrls: ['./plan-management.component.scss']
})
export class PlanManagementComponent implements OnInit {
  plans: PlanDto[] = [];
  paginatedPlans: PlanDto[] = [];
  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  searchKeyword = '';
  isLoading = false;
  visiblePages: (number | null)[] = [];

  selectedPlan: PlanDto = { planName: '', isActive: true, createdBy: 'admin' };
  isEditMode = false;

  @ViewChild('planModal') planModal: any;

  constructor(private api: PlanService, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.loadPlans(this.currentPage, this.pageSize);
  }

  loadPlans(pageNumber: number, pageSize: number, search?: string): void {
    this.isLoading = true;
    this.api.getPlanList(pageNumber, pageSize, search).subscribe({
      next: (res: PlanListResponse) => {
        this.plans = res.data;
        this.totalRecords = res.totalCount;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = res.pageNumber;
        this.updateVisiblePages();
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        Swal.fire('Error', err.error?.message || 'Failed to load plans', 'error');
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

  applyFilter(): void {
    const keyword = this.searchKeyword.toLowerCase();
    this.paginatedPlans = this.plans.filter(p =>
      p.planName.toLowerCase().includes(keyword)
    );
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPlans(this.currentPage, this.pageSize, this.searchKeyword);
  }

  onSearchInput(): void {
    this.currentPage = 1;
    this.loadPlans(this.currentPage, this.pageSize, this.searchKeyword);
  }

  resetSearch(): void {
    this.searchKeyword = '';
    this.currentPage = 1;
    this.loadPlans(this.currentPage, this.pageSize);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadPlans(page, this.pageSize, this.searchKeyword);
  }

  openModal(content: any, plan?: PlanDto): void {
    if (plan) {
      this.selectedPlan = { ...plan };
      this.isEditMode = true;
    } else {
      this.selectedPlan = { planName: '', isActive: true, createdBy: 'admin' };
      this.isEditMode = false;
    }
    this.modalService.open(this.planModal, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  savePlan(modalRef: any): void {
    if (!this.selectedPlan.planName?.trim()) {
      Swal.fire('Validation', 'Plan Name is mandatory', 'warning');
      return;
    }

    if (this.selectedPlan.planName.trim().length < 3) {
      Swal.fire('Validation', 'Plan Name must be at least 3 characters', 'warning');
      return;
    }

    const action = this.isEditMode
      ? this.api.updatePlan(this.selectedPlan)
      : this.api.createPlan(this.selectedPlan);

    action.subscribe({
      next: () => {
        Swal.fire('Success', `Plan ${this.isEditMode ? 'updated' : 'created'} successfully`, 'success');
        modalRef.close();
        this.loadPlans(this.currentPage, this.pageSize, this.searchKeyword);
      },
      error: (err) => {
        const errorMessage = err.error?.message || err.error?.text || 'Something went wrong';
        Swal.fire('Error', errorMessage, 'error');
      }
    });
  }

  deletePlan(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the plan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5e2f82',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.deletePlan(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Plan has been deleted successfully', 'success');
            this.loadPlans(this.currentPage, this.pageSize, this.searchKeyword);
          },
          error: (err) => {
            const errorMessage = err.error?.message || err.error?.text || 'Failed to delete plan';
            Swal.fire('Error', errorMessage, 'error');
          }
        });
      }
    });
  }

  toggleStatus(plan: PlanDto): void {
    const newStatus = !plan.isActive;
    Swal.fire({
      title: 'Are you sure?',
      text: `This will ${newStatus ? 'activate' : 'deactivate'} the plan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5e2f82',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, change it!'
    }).then(result => {
      if (result.isConfirmed) {
        const updatedPlan = { ...plan, isActive: newStatus };
        this.api.updatePlan(updatedPlan).subscribe({
          next: () => {
            Swal.fire('Success', `Plan ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
            this.loadPlans(this.currentPage, this.pageSize, this.searchKeyword);
          },
          error: (err) => {
            const errorMessage = err.error?.message || err.error?.text || 'Failed to update status';
            Swal.fire('Error', errorMessage, 'error');
          }
        });
      }
    });
  }
}
