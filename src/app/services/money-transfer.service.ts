// money-transfer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MoneyTransferService {
  private baseUrl = 'https://instantpayment.co.in/api';
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

  getTRAMOSenderInfo(senderMobile: string, sessionKey: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/CheckSender`, {
      SessionKey: sessionKey,
      APIKey: "CheckSender001",
      SenderMobile: senderMobile
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

  registerTramoSender(senderMobile: string, firstName: string, lastName: string, address: string, pincode: string, sessionKey: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/SenderRegistraion`, {
      SessionKey: sessionKey,
      APIKey: "SenderReg001",
      SenderMobile: senderMobile,
      FirstName: firstName,
      LastName: lastName,
      Address: address,
      Pincode: pincode
    });
  }

  validateTramoSenderOtp(senderMobile: string, otp: string, state: string, sessionKey: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/SenderValidateOTP`, {
      SessionKey: sessionKey,
      APIKey: "SenderValidate001",
      SenderMobile: senderMobile,
      OTP: otp,
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

  checkPPISender(SessionKey: string, senderMobile: string, pincode: string, rtName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/PPIsenderCheck`, {
      SessionKey: SessionKey,
      SenderMobile: senderMobile,
      APIKey: "PPI01",
      Pincode: pincode,
      RTName: rtName
    });
  }

  validatePPIOtp(SessionKey: string, otpToken: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/PPIValidateOTP`, {
      SessionKey: SessionKey,
      OTPToken: otpToken,
      APIKey: "PPI01",
      OTP: otp
    });
  }

  getPPIBeneficiaries(SessionKey: string, senderMobile: string, tokeyKey: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/PPIBeneList`, {
      SessionKey: SessionKey,
      SenderMobile: senderMobile,
      APIKey: "PPI01",
      TokeyKey: tokeyKey
    });
  }

  PPISendAadharOTP(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/PPISendAadharOTP`, payload);
  }

  PPIValidateAadharOTP(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/PPIValidateAadharOTP`, payload);
  }

  PPIValidateAadharBiometric(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/PPIValidateAadharBiometric`, payload);
  }

  PPIValidatePan(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/PPIValidatePan`, payload);
  }

  PPIAddBeneficiary(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/PPIAddBene`, payload);
  }


  PPISendPaymentOTP(
    sessionKey: string,
    apiKey: string,
    tokeyKey: string,
    senderMobile: string,
    beneId: string,
    amount: string,
    accountNo: string,
    ifscCode: string
  ): Observable<any> {
    const payload = {
      SessionKey: sessionKey,
      APIKey: apiKey,
      TokeyKey: tokeyKey,
      SenderMobile: senderMobile,
      BeneId: beneId,
      Amount: amount,
      AccountNo: accountNo,
      Ifsccode: ifscCode
    };

    return this.http.post<any>(`${this.baseUrl}/PPISendPaymentOTP`, payload);
  }

  PPIMoneyTransfer(payload: any) {
    return this.http.post<any>(`${this.baseUrl}/PPIMoneyTransfer`, payload);
  }



}
