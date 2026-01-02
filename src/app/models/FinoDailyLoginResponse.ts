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
  amount: string;
  txntype: string;
  BankName: string;
  latitude: string;
  longitude: string;
  fingerdata: string;
  DeviceSrNo: string;
  deviceType: string;
}

export interface FinoAepsResponse {
  Status_Code: string;
  Message: string;
  Data: any[];
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