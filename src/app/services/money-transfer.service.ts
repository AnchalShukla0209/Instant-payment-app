// money-transfer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MoneyTransferService {
  private baseUrl = 'https://instantpayment.co.in/api';
  private ppiBaseUrl = 'https://api.instantpayment.co.in/api/PPI';
  //private baseUrl = '/api';


  constructor(private http: HttpClient) { }

  // 1. Check if Sender Exists
  getSenderInfo(senderMobile: string, merchantMobile: string, lat: string, lng: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/DMTSenderinfo`, {
      SenderMobile: senderMobile,
      MerchantMobileNo: merchantMobile,
      Latitude: lat,
      longitude: lng
    });
  }

  getTRAMOSenderInfo(userId: string, senderMobile: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Sender/login`, {
      userId: userId,
      apiKey: "CheckSender001",
      senderMobile: senderMobile
    });
  }

  // 2. KYC Process
  doKyc(senderMobile: string, merchantMobile: string, aadharNo: string, pid: string, lat: string, lng: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/DMTKYCProcess`, {
      SenderMobile: senderMobile,
      MerchantMobileNo: merchantMobile,
      Latitude: lat,
      longitude: lng,
      AadharNo: aadharNo,
      Pid: pid,
      deviceType: "2"
    });
  }

  // 3. Send OTP
  sendOtp(senderMobile: string, merchantMobile: string, customerName: string, lat: string, lng: string, otptype: string, benename?: string | null,
    accountno?: string | null,
    ifsccode?: string | null): Observable<any> {
    return this.http.post(`${this.baseUrl}/DMTSendOTP`, {
      SenderMobile: senderMobile,
      MerchantMobileNo: merchantMobile,
      Latitude: lat,
      longitude: lng,
      customername: customerName,
      otptype: otptype,
      benename: benename,
      accountno: accountno,
      ifsccode: ifsccode,
    });
  }

  // 4. Add Sender
  addSender(senderMobile: string, merchantMobile: string, otp: string, otpReqId: string, kycReqId: string, lat: string, lng: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/DMTAddSender`, {
      SenderMobile: senderMobile,
      MerchantMobileNo: merchantMobile,
      Latitude: lat,
      longitude: lng,
      OTPPin: otp,
      OTPRequestId: otpReqId,
      KYCRequestId: kycReqId,
    });
  }

  // 5. Add Beneficiary
  addBeneficiary(senderMobile: string, bene: any, SenderId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/HAddBene`, {
      SenderMobile: senderMobile,
      SessionKey: '1',
      APIKey: 'AddBene001',
      SenderId: SenderId,
      BeneName: bene.BeneName,
      AccountNo: bene.AccountNo,
      IFSCCode: bene.IFSCCode,
      BankName: bene.BankName,
      AVStatus: 'NO',
    });
  }

  // 6. Get Beneficiary Info
  getBeneficiaryInfo(senderMobile: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/HBeneInfo`, {
      SenderMobile: senderMobile,
      Stype: 'BA',
    });
  }

  getLocation(): Promise<{ latitude: string; longitude: string }> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude.toString(),
              longitude: pos.coords.longitude.toString()
            });
          },
          (err) => {
            console.error('Geolocation error:', err);
            resolve({
              latitude: '28.6130176',
              longitude: '77.2308992'
            });
          }
        );
      } else {
        resolve({
          latitude: '28.6130176',
          longitude: '77.2308992'
        });
      }
    });
  }

  DeleteBeneficiary(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/HDeleteBene`, payload);
  }

  PPIDeleteBeneficiary(payload: any): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIBeneficiary/DeleteGetOtp`, payload);
  }

  PPIFinalDeleteBeneficiary(payload: any): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIBeneficiary/DeleteVerifyOtp`, payload);
  }

  getBankList(payload: any): Observable<any> {

    return this.http.post(`${this.baseUrl}/GetBank`, payload);
  }

  verifyAccount(payload: any) {
    return this.http.post(`${this.baseUrl}/AccountVarify`, payload);
  }

  moneyTransfer(request: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/FinoMoneyTransfer`, request);
  }

  getTRAMOBeneficiaryInfo(senderMobile: string, sessionKey: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/BeneList`, {
      SessionKey: sessionKey,
      APIKey: "BeneList001",
      SenderMobile: senderMobile
    });
  }

  registerTramoSender(userId: string, senderMobile: string, firstName: string, lastName: string, address: string, pincode: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Sender/registration`, {
      userId: userId,
      apiKey: "SenderReg001",
      senderMobile: senderMobile,
      firstName: firstName,
      lastName: lastName,
      address: address,
      pincode: pincode
    });
  }

  validateTramoSenderOtp(userId: string, senderMobile: string, otp: string, state: string): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Sender/ekyc`, {
      userId: userId,
      apiKey: "SenderValidate001",
      senderMobile: senderMobile,
      otp: otp,
      state: state
    });
  }

  addBeneficiary_TRAMO(
    sessionKey: string,
    senderMobile: string,
    accountNo: string,
    ifsc: string,
    bankName: string,
    beneName: string
  ): Observable<any> {
    const apiUrl = "https://instantpayment.co.in/api/BeneRegistraion";

    const payload = {
      SessionKey: sessionKey,
      APIKey: "BeneReg001",
      SenderMobile: senderMobile,
      IfscCode: ifsc,
      AccountNo: accountNo,
      BankName: bankName,
      BeneName: beneName
    };

    return this.http.post(apiUrl, payload);
  }

  TramomoneyTransfer(request: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/MoneyTransfer`, request);
  }

  CastleMoneyTransfer(request: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/MoneyTransfer`, request);
  }

  checkPPISender(userId: string, senderMobile: string, pincode: string, rtName: string): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIOtp/GenerateOtp`, {
      userId: userId,
      senderMobile: senderMobile,
      apiKey: "PPI01",
      pincode: pincode,
      rtName: rtName
    });
  }

  validatePPIOtp(userId: string, otpToken: string, otp: string): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIOtp/VerifyOtp`, {
      userId: userId,
      otpToken: otpToken,
      apiKey: "PPI01",
      otp: otp
    });
  }

  getPPIBeneficiaries(userId: string, senderMobile: string, tokeyKey: string): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIBeneficiary/GetBeneficiaryList`, {
      userId: userId,
      senderMobile: senderMobile,
      apiKey: "PPI01",
      tokeyKey: tokeyKey
    });
  }

  PPISendAadharOTP(payload: any): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIAadhar/GenerateAadharOtp`, payload);
  }

  PPIValidateAadharOTP(payload: any): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIAadhar/ValidateAadharOtp`, payload);
  }

  PPIValidateAadharBiometric(payload: any): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIAadhar/AadharBiometric`, payload);
  }

  PPIValidatePan(payload: any): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIAadhar/ValidatePan`, payload);
  }

  PPIAddBeneficiary(payload: any): Observable<any> {
    return this.http.post<any>(`${this.ppiBaseUrl}/PPIBeneficiary/AddBeneficiary`, payload);
  }

  PPIAddBeneficiaryResendOTP(payload: any): Observable<any> {
    return this.http.post<any>(`${this.ppiBaseUrl}/PPIBeneficiary/ResendOtp`, payload);
  }

  PPIAddBeneficiaryValidateOTP(payload: any): Observable<any> {
    return this.http.post<any>(`${this.ppiBaseUrl}/PPIBeneficiary/ValidateOtp`, payload);
  }


  PPISendPaymentOTP(payload: any): Observable<any> {
    return this.http.post<any>(`${this.ppiBaseUrl}/PPIFundTransfer/GetOtp`, payload);
  }

  PPIMoneyTransfer(payload: any) {
    return this.http.post<any>(`${this.ppiBaseUrl}/PPIMoneyTransfer/Transfer`, payload);
  }

  CastelMoneyTransfer(payload:any)
  {
    return this.http.post<any>(`${environment.apiBaseUrl}/MoneyTransfer/transfer`, payload);
  }

  CheckStatusCastelMoneyTransfer(txnId:string)
  {
    return this.http.get<any>(`${environment.apiBaseUrl}/MoneyTransfer/status/${txnId}`);
  }

  NifiMoneyTransfer(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseUrl}/MoneyTransfer/nifi/transfer`, payload);
  }

  CheckStatusNifiMoneyTransfer(txnId: string) {
    return this.http.get<any>(`${environment.apiBaseUrl}/MoneyTransfer/nifi/status/${txnId}`);
  }

  FZPMoneyTransfer(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseUrl}/MoneyTransfer/fzp/transfer`, payload);
  }

  CheckStatusFZPMoneyTransfer(txnId: string) {
    return this.http.get<any>(`${environment.apiBaseUrl}/MoneyTransfer/fzp/status/${txnId}`);
  }

  ARPMoneyTransfer(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseUrl}/MoneyTransfer/arp/transfer`, payload);
  }

  CheckStatusARPMoneyTransfer(txnId: string) {
    return this.http.get<any>(`${environment.apiBaseUrl}/MoneyTransfer/arp/status/${txnId}`);
  }

  RKITMoneyTransfer(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiBaseUrl}/MoneyTransfer/rkit/transfer`, payload);
  }

  CheckStatusRKITMoneyTransfer(txnId: string) {
    return this.http.get<any>(`${environment.apiBaseUrl}/MoneyTransfer/rkit/status/${txnId}`);
  }

  // New Beneficiary APIs
  SaveBeneficiary(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Beneficiary/Save`, payload);
  }

  GetBeneficiaryList(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Beneficiary/GetBeneficiaryList`, payload);
  }

  SendBeneficiaryOtp(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Beneficiary/SendOtp`, payload);
  }

  ResendBeneficiaryOtp(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Beneficiary/ResendOtp`, payload);
  }

  DeleteBeneficiaryWithOtp(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/Beneficiary/Delete`, payload);
  }

  PPILoadWallet(payload: any): Observable<any> {
    return this.http.post(`${this.ppiBaseUrl}/PPIWallet/LoadWallet`, payload);
  }
}
