import { CommonModule } from '@angular/common';
import { Component, signal, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SuperAdminService } from '../../services/superadmindashboard.service';
import {
  ChartComponent,
  NgApexchartsModule
} from 'ng-apexcharts';

import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexResponsive,
  ApexLegend,
  ApexFill,
  ApexStroke,
  ApexDataLabels,
  ApexXAxis,
  ApexGrid,
  ApexTitleSubtitle
} from 'ng-apexcharts';
import { LoaderComponent } from '../app-loader/loader.component';
import { Superadmindashboardpayload } from '../../models/SuperAdminDData';


export type LineChartOptions = {
  series: { name: string; data: number[] }[];
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  xaxis: ApexXAxis;
  grid: ApexGrid;
};

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  legend: ApexLegend;
  fill: ApexFill;
};

@Component({
  selector: 'app-superadmindashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule,LoaderComponent],
  templateUrl: './dashboard.superadmin.component.html',
  styleUrls: ['./dashboard.superadmin.component.scss']
})
export class superadmindashboardComponent implements OnInit  {
  
  private _serviceList = signal<{ ServiceId: number, ServiceName: string }[]>([]);
  private _selectedServiceId = signal<number>(0);
  private _selectedYear = signal<number>(2025);

  yearList = [2023, 2024, 2025];

  private _walletAmount = signal<number>(0);
  private _totalUsers = signal<number>(0);
  private _totalTransactions = signal<number>(0);
  isLoading= false;
  year: number =2025;
  serviceid : number =0;
  get serviceList() {
    return this._serviceList();
  }

  get selectedServiceId() {
    return this._selectedServiceId();
  }

  get selectedYear() {
    return this._selectedYear();
  }

  get walletAmount() {
    return this._walletAmount();
  }

  get totalUsers() {
    return this._totalUsers();
  }

  get totalTransactions() {
    return this._totalTransactions();
  }


  lineChartOptions: LineChartOptions = {
    series: [{ name: 'Transactions', data: [] }],
    chart: { type: 'area', height: 300 },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' },
    title: { text: '', align: 'left' },
    xaxis: { categories: [] },
    grid: { row: { colors: ['#f3f3f3', 'transparent'], opacity: 0.5 } }
  };

  pieChartOptions: PieChartOptions = {
    series: [0, 0, 0],
    chart: { width: 465, type: 'pie' },
    labels: ['Success', 'Pending', 'Failed'],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 300 },
          legend: { position: 'bottom' }
        }
      }
    ],
    legend: { position: 'right', show: true },
    fill: { type: 'gradient' }
  };

  constructor(private http: HttpClient, private superDDData: SuperAdminService) {}

  ngOnInit(): void {
    this.fetchDashboardData();

    effect(() => {
      this.fetchDashboardData(); // auto-fetch on dropdown changes
    });
  }

  get dashboardCards() {
  return [
    {
      icon: 'wallet2',
      label: 'Business Wallet',
      value: `₹${this.walletAmount}`,
      color: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    {
      icon: 'graph-up',
      label: 'Total Transactions',
      value: this.totalTransactions.toString(),
      color: 'linear-gradient(135deg, #00c9ff, #92fe9d)'
    },
    {
      icon: 'credit-card',
      label: 'Users Joined',
      value: this.totalUsers.toString(),
      color: 'linear-gradient(135deg, #f7971e, #ffd200)'
    }
  ];
}


  fetchDashboardData(): void {
    this.isLoading= true;
    const payload :Superadmindashboardpayload= {
      ServiceId: Number(this._selectedServiceId()),
      Year: Number( this._selectedYear())
    };
this.superDDData.GetDashboardData(payload).subscribe({
    next: (res) => {
      debugger
      this._serviceList.set(
        (res.services || []).map((s: any) => ({
          ServiceId: s.ServiceId,
          ServiceName: s.ServiceName
        }))
      );
      this._walletAmount.set(res.walletAmount);
      this._totalUsers.set(res.totalUserJoined);
      this._totalTransactions.set(res.totalTransection);

      this.pieChartOptions.series = res.pieData || [0, 0, 0];
      this.lineChartOptions.series = [
        { name: 'Transactions', data: res.lineData || [] }
      ];
      this.lineChartOptions.xaxis.categories = res.lineLabels || [];
      this.isLoading= false;
    }
  });




}

onServiceChange(event: Event): void {
    //const id = +(event.target as HTMLSelectElement).value;
  //const servicevalue= this.serviceid;
  this._selectedServiceId.set(this.serviceid);
  this.fetchDashboardData();
  }

  onYearChange(event: Event): void {
  //const year = +(event.target as HTMLSelectElement).value;
  //  yearvalue: number= this.year;
  this._selectedYear.set(this.year);
  this.fetchDashboardData(); // trigger API
  }
}