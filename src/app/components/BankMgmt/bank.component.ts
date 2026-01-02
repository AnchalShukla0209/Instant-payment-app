import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../app-loader/loader.component';
import { BankService } from '../../services/bank.service';
import { BankDto, PagedResult } from '../../models/BankDto';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-bank-list',
  standalone: true,
  imports: [FormsModule, CommonModule, LoaderComponent, NgbTypeaheadModule, NgbToastModule],
  templateUrl: './bank.component.html',
  styleUrls: ['./bank.component.scss']
})
export class BankListComponent implements OnInit {
  banks: BankDto[] = [];
  paginatedBanks: BankDto[] = [];
  totalRecords = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  searchKeyword = '';
  isLoading = false;
  visiblePages: (number | null)[] = [];
  selectedBank: BankDto = {
    bankId: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    phoneNo: '',
    txnCharge: 0,
    isActive: true
  };
  isEditMode = false;

  @ViewChild('bankModal') bankModal: any;

  constructor(private api: BankService, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.loadBanks(this.currentPage, this.pageSize);
  }

  // Load banks from API
  loadBanks(pageIndex: number, pageSize: number): void {
    this.isLoading = true;
    this.api.getAll(pageIndex, pageSize).subscribe({
      next: (res: PagedResult<BankDto>) => {
        this.banks = res.items;
        this.totalRecords = res.totalCount;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.currentPage = pageIndex;
        this.updateVisiblePages();
        this.applyFilter();
        this.isLoading = false;
      },
      error: () => (this.isLoading = false)
    });
  }

  // Pagination logic
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

  // Filter banks by search keyword
  applyFilter(): void {
    const keyword = this.searchKeyword.toLowerCase();
    this.paginatedBanks = this.banks.filter(b => b.bankName.toLowerCase().includes(keyword));
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadBanks(page, this.pageSize);
  }

  // Open modal for add/edit
  openModal(content: any, bank?: BankDto): void {
    if (bank) {
      this.selectedBank = { ...bank };
      this.isEditMode = true;
    } else {
      this.selectedBank = {
        bankId: uuidv4(), // generate GUID for new bank
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        phoneNo: '',
        txnCharge: 0,
        isActive: true
      };
      this.isEditMode = false;
    }
    this.modalService.open(this.bankModal, { size: 'lg', backdrop: 'static', keyboard: false });
  }

  // Save bank (create/update)
  saveBank(modalRef: any): void {
  const bank = this.selectedBank;

  // Existing frontend validations (Bank Name, Account No, IFSC, Phone, TxnCharge)
  if (!bank.bankName?.trim()) {
    Swal.fire('Validation', 'Bank Name is mandatory', 'warning');
    return;
  }

  if (!bank.accountNumber?.trim() || !/^\d+$/.test(bank.accountNumber)) {
    Swal.fire('Validation', 'Account Number is mandatory and should contain digits only', 'warning');
    return;
  }

  if (!bank.ifscCode?.trim() || !/^[A-Za-z]{4}\d{7}$/.test(bank.ifscCode)) {
    Swal.fire('Validation', 'IFSC Code is mandatory and should be valid (e.g., ABCD0123456)', 'warning');
    return;
  }

  if (!bank.phoneNo?.trim()) {
    bank.phoneNo = '------';
  } else if (!/^\d{10}$/.test(bank.phoneNo)) {
    Swal.fire('Validation', 'Phone Number should be 10 digits', 'warning');
    return;
  }

  if (bank.txnCharge == null || bank.txnCharge === undefined) {
    bank.txnCharge = 0;
  }

  // Call API
  const action = this.isEditMode
    ? this.api.update(bank.bankId, bank)
    : this.api.create(bank);

  action.subscribe({
    next: () => {
      Swal.fire('Success', 'Bank saved successfully', 'success');
      modalRef.close();
      this.loadBanks(this.currentPage, this.pageSize);
    },
    error: (err) => {
      // If backend sends a specific validation message
      const errorMessage =
        err.error?.text || // if your backend uses err.error.text
        err.error?.message || // or err.error.message
        err.message || 
        'Something went wrong';

      Swal.fire('Error', errorMessage, 'error');
    }
  });
}



  // Delete bank
  deleteBank(id: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the bank.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#5e2f82',
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.api.delete(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Bank has been deleted.', 'success');
            this.loadBanks(this.currentPage, this.pageSize);
          },
          error: () => Swal.fire('Error', 'Failed to delete bank', 'error')
        });
      }
    });
  }

  // Allow only numeric input with optional dot
  validateNumber(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const inputChar = event.key;
    if (allowedKeys.includes(inputChar)) return;

    const current: string = (event.target as HTMLInputElement).value;
    if (!/^\d*\.?\d*$/.test(current + inputChar)) event.preventDefault();
  }
}
