import { Component, signal,ViewChild,inject  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, debounceTime, distinctUntilChanged, map, switchMap  } from 'rxjs';
import { NgbModal, NgbTypeaheadModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import html2pdf from 'html2pdf.js';
import { LoaderComponent } from '../app-loader/loader.component';
import { OperatorService } from '../../services/operator.service';
import { HttpClient } from '@angular/common/http';
import { EncryptionService } from '../../encryption/encryption.service';
import { RechargeRequest } from '../../models/recharge.model';
import { RechargeService } from '../../services/recharge.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-AEPS',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbTypeaheadModule, NgbToastModule,LoaderComponent],
  templateUrl: './AEPS.component.html',
  styleUrls: ['./AEPS.component.scss']
})
export class AEPSComponent {
  private rechargeService = inject(RechargeService);
  private authServiceobj = inject(AuthService);
  private router = inject(Router);
  selectedService: string = 'Balance Enquiry';
  selectedicon: string ='bi-phone';
  showRecentTxns = false;
  amount:any=null;
  
  services = [
    { key: 'PREPAID', label: 'Balance Enquiry', icon: 'bi-phone' },
    { key: 'WITHDRAW', label: 'Cash Withdrawal', icon: 'bi-cash-stack' },
    { key: 'DEPOSIT', label: 'Cash Deposit', icon: 'bi-wallet2' },
    { key: 'STATEMENT', label: 'Mini Statement', icon: 'bi-receipt-cutoff' },
    { key: 'AADHAARPAY', label: 'Aadhar Pay', icon: 'bi-fingerprint' }
  ];
  onTabSelect(service: string) {
    this.selectedService = service;
    this.selectedicon= this.selectedService==='Balance Enquiry'?'bi-phone':this.selectedService==='Cash Withdrawal'?'bi-cash-stack'
    :this.selectedService==='Cash Deposit'?'bi-wallet2':this.selectedService==='Mini Statement'?'bi-receipt-cutoff':
    this.selectedService==='Aadhar Pay'?'bi-fingerprint':'';
    this.amount = null;
  }
  selectedTab() {
    return this.selectedService;
  }
  get colClass(): string {
    if(this.showRecentTxns)
    {
        return 'form-group';
    }
    const hasAmount = ['Cash Withdrawal', 'Cash Deposit', 'Aadhar Pay'].includes(this.selectedTab());
    return hasAmount ? 'col-md-3' : 'col-md-4';
  }
   toggleRecentTxns() {
    this.showRecentTxns = !this.showRecentTxns;
  }

  loadMobilePlans() {}
 
  onScanSuccess() {
    this.fingerprintSuccess = true;
  }

  mobileNumber = '';
  mobileAadhar = '';
  bankname= '';
  txnPin = '';
  otp = '';
  showPinError = false;
  fingerprintSuccess = false;
  isLoading = false;
  toastMessages: string[] = [];

  showMobileError = false;
  showOperatorError = false;
  showAmountError = false;
  operatorList: any[] = [];
  

  errors = {
    mobileNumber: '',
    mobileOperator: '',
    mobileAadhar: ''
  };

  selectedDevice = '';

  devices: { id: string; label: string; icon: string }[] = [
    { id: 'Mantra', label: 'Mantra L1', icon: 'myntra.png' },
    { id: 'Morpho', label: 'Morpho L1', icon: 'morpho.jpg' },
    { id: 'Startek', label: 'Startek L1', icon: 'Startek.jpg'}
  ];

  captureDone = signal(false);
  finalUrl: string = '';
  MethodCapture: string = '';
  MethodInfo: string = '';

  async discoverRdService(deviceType: 'Mantra' | 'Morpho'|'Startek'): Promise<boolean> {
    const isHttps = window.location.href.includes('https');
    const primaryUrl = isHttps ? 'https://127.0.0.1:' : 'http://127.0.0.1:';

    const handleSuccess = (data: string, port: number): boolean => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');
      const info = xmlDoc.querySelector('RDService')?.getAttribute('info');

      if (!info || !info.toLowerCase().includes(deviceType.toLowerCase())) return false;

      this.finalUrl = primaryUrl + port;
      const interfaces = xmlDoc.querySelectorAll('Interface');
      interfaces.forEach((node) => {
        const path = node.getAttribute('path');
        if (path === '/rd/capture') this.MethodCapture = path;
        if (path === '/rd/info') this.MethodInfo = path;
      });

      console.log(`✅ RDService found for ${deviceType} at port ${port}`);
      return true;
    };

    return new Promise((resolve, reject) => {
      const ports = Array.from({ length: 21 }, (_, i) => 11100 + i);

      const tryNextPort = (index: number) => {
        if (index >= ports.length) {
          this.isLoading = false;
          this.toastr.error('Connection failed. Please try again.');
          return reject('Device not found');
        }

        const port = ports[index];
        fetch(primaryUrl + port, {
          method: 'RDSERVICE',
          mode: 'cors',
        })
          .then((res) => res.text())
          .then((data) => {
            if (handleSuccess(data, port)) {
              resolve(true);
            } else {
              tryNextPort(index + 1);
            }
          })
          .catch(() => {
            tryNextPort(index + 1);
          });
      };

      tryNextPort(0);
    });
  }

  async captureRdData(deviceType: 'Mantra' | 'Morpho' |'Startek'): Promise<string> {
    this.isLoading = true;

    try {
      await this.discoverRdService(deviceType);

      const pidXml = `
        <PidOptions ver="1.0">
          <Opts fCount="1" fType="2" iCount="0" pCount="0" format="0" pidVer="2.0" timeout="10000" posh="UNKNOWN" env="P" />
        </PidOptions>`;

      const response = await fetch(this.finalUrl + this.MethodCapture, {
        method: 'CAPTURE',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body: pidXml,
      });

      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');
      const errCode = xmlDoc.querySelector('Resp')?.getAttribute('errCode') || '';
      const errInfo = xmlDoc.querySelector('Resp')?.getAttribute('errInfo') || '';

      const errorCodes = [
        '700', '720', '1001', '2100', '740', '214', '10', '28', '4001',
        '207', '6', '216', '571', '4003', '215', '52',
      ];

      this.isLoading = false;

      if (errorCodes.includes(errCode)) {
        this.toastr.error(`${errInfo} capture failed or RD not connected.`);
        throw new Error(`${errInfo} capture failed or RD not connected.`);
      }

      return data;
    } catch (err: any) {
      this.isLoading = false;
      throw err;
    }
  }

selectDevice(deviceId: string) {
    this.selectedDevice = deviceId;
  }

  startCapture(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    this.isLoading = true;
debugger;
    this.captureRdData(this.selectedDevice as 'Mantra' | 'Morpho' | 'Startek')
      .then(xml => {
        this.fingerprintSuccess = true;
        this.toastr.success('Capture Success\n\n' + xml);
        
      })
      .catch(err => {
        this.fingerprintSuccess = false;
        this.toastr.error(err.message || 'Capture failed');
      })
      .finally(() => {
        this.isLoading = false;
      });
  

  }



  @ViewChild('invoiceModal') invoiceModal: any;


  constructor(private modalService: NgbModal, private toastr: ToastrService,private operatorService: OperatorService) {}



  inputFormatter = (x: any) => x.label;
  resultFormatter = (x: any) => x.label;




  showToastsFromErrors() {
    this.toastMessages = [];
    if (this.mobileNumber.trim().length < 10) {
      this.toastr.error('Mobile number is required', 'Error');
    }

    
  }

  removeToast(msg: string) {
    this.toastMessages = this.toastMessages.filter(m => m !== msg);
  }

  openPreviewModal(modalContent: any) {
  
    this.modalService.open(modalContent, { centered: true, size: 'md', backdrop: 'static', keyboard: false  });
  }

  generateCustomerRefNo(): string {
  const length = 12;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


  submitRecharge() {
    this.isLoading=true;
    if (!this.txnPin || this.txnPin.trim().length === 0) {
      this.showPinError = true;
      this.isLoading=false;
      return;
    }

    this.showPinError = false;
    debugger
    const userId = this.authServiceobj.getUserId();
    const userName = this.authServiceobj.getUsername();

    if (!userId || !userName) {
      this.toastr.error('Session expired. Please login.');
      this.router.navigate(['/login']);
      return;
    }
    const payload: RechargeRequest = {
      UserId: Number(userId),
      userName,
      MobileNumber: this.mobileNumber,
      Operator:  '',
      operatorCode:  '',
      Amount: 12323,
      TxnPin: this.txnPin,
      Type: 'BLL2',
      CustomerRefNo: this.generateCustomerRefNo()
    };

    this.rechargeService.submitRecharge({payload }).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastr.success(`Recharge Submitted for ${this.mobileNumber} ` || 'Recharge successful');
          this.modalService.open(this.invoiceModal, { size: 'lg', backdrop: 'static', keyboard: false  });
          this.isLoading=false;
          // Optionally show invoice popup here
        } else {
          this.toastr.error(res.message || 'Recharge failed');
          this.isLoading=false;
        }
      },
      error: () => this.toastr.error('API error. Try again later.'),
    });

  }

  onPinChange() {
    if (this.txnPin && this.txnPin.trim().length > 0) {
      this.showPinError = false;
    }
  }

downloadInvoice() {
    this.isLoading=true;
  const original = document.getElementById('invoiceContent')!;
  const clone = original.cloneNode(true) as HTMLElement;

  // Remove animation for PDF
  const icon = clone.querySelector('.success-icon');
  if (icon) {
    icon.classList.add('no-animate');
  }

  html2pdf().set({
    margin: 0.2,
    filename: 'Recharge_Invoice.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).from(clone).save();
  this.isLoading=false;
}

}
