import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TxnReportPayload, TxnReportData, PaginatedTxnResultDto } from '../../models/TxnReport.model';
import { TxnReportService } from '../../services/Txn.report.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatePipe,CommonModule  } from '@angular/common';


@Component({
  selector: 'app-txn-report',
  standalone: true,
  imports: [DatePipe,CommonModule, FormsModule],
  templateUrl: './txn-report.component.html',
  styleUrl: './txn-report.component.scss',
})

export class TxnReportComponent implements OnInit {
  txnForm!: FormGroup;
  records: any[] = [];
  totalRecords = 0;
  loading = false;
  // Dropdown options
  services = ['All Service', 'Mobile Recharge', 'AEPS', 'MATM','DTH','ELECTRICITY','DMT','UPI', 'QR CODE', 'ONLINE PAYMENT','LESSER REPORT','ADMIN LESSER REPORT'];
  statuses = ['All', 'Success', 'Pending', 'Failed'];
  users = [{ label: 'Anchal', value: 1 }, { label: 'Admin', value: 2 }];

  constructor(private fb: FormBuilder, private txnService: TxnReportService) {}

  ngOnInit(): void {
    debugger
    this.txnForm = this.fb.group({
      serviceType: ['All Service'],
      status: [''],
      dateFrom: [null],
      dateTo: [null],
      userId: [0],
    });

    //this.loadData(2, 50);
  }

  onSearch(): void {
    this.loadData(1, 50);
  }

  onReset(): void {
    this.txnForm.reset({ serviceType: 'All Service', status: '' });
    this.loadData(1, 50);
  }

  loadData(pageIndex: number=1, pageSize: number): void {
    const payload: TxnReportPayload = {
      serviceType: this.txnForm.value.serviceType,
      status: this.txnForm.value.status,
      dateFrom: this.formatDate(this.txnForm.value.dateFrom),
      dateTo: this.formatDate(this.txnForm.value.dateTo),
      userId: this.txnForm.value.userId,
      pageIndex,
      pageSize,
    };

    this.loading = true;
    this.txnService.getTxnReport(payload).subscribe({
      next: (res:any) => {
        this.records = res.Data;
        this.totalRecords = res.TotalTransactions;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  paginate(event: any): void {
    this.loadData(event.page, event.rows);
  }

  private formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }
}