export interface FinoDailyLoginResponse {
  Status_Code: string;
  Message: string;
  Data: string | any; 
}

export interface FinoAepsRequest {
  SessionKey: string;
  APIKey: string;
  aadharno: string;
  bankiinno: string;
  mobileno: string;
  customermobileno?: string | number;
  amount: string;
  txntype: string;
  BankName: string;
  latitude: string;
  longitude: string;
  fingerdata: string;
  DeviceSrNo: string;
  deviceType: string;
  comingFrom: string;
  merAuthTxnId?: string;
  npciTxnId?: string;
  npciTxnRefNo?: string;
  npciOtpFor?: string;
}

export interface FinoMerchantEKYCRequest {
  SessionKey: string;
  APIKey: string;
  aadharno: string;
  NameasperPan: string;
  mobileno: string;
  DOB: string;
  Pancardno: string;
  Firstname: string;
  LastName: string;
  fingerdata: string;
  deviceType: string;
}


export interface FinoAepsResponse {
  Status_Code: string;
  Message: string;
  Data: any[];
}

export interface FinoAepsTransactionStatusRequest {
  userid: string;
  APIKey: string;
  ClientRefID: string;
}

export interface JIODailyLoginResponse {
  success: boolean;
  message: string;
  txnid: string;
  apitxnid: string;
  transactiondatetime: string;
  agentLoginId: string;
  agentPinCode: string;
  lattitude: Number;
  longtitude: string;
  statusCode: string;
  aepsauthtoken: string;
  appidentifiertoken: string;
}

export interface JIODailyTokenResponse {
  aepsauthtoken: string;
  appidentifiertoken: string;
}