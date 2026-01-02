// export interface LoginResponse {
//   Token: string;
//   Username: string;
//   Usertype: string;
//   OTP: string;
//   IsOtpRequired: boolean;
//   messaege: string;
//   Phoneno: string
// }

export interface LoginResponse {
  Status_Code: string;
  Message: string;
  Data: LoginUser[];
  SessionKey: string;
  LogoImage: string;
  Permission: PermissionItem[];
  OTPStatus: string; // "YES" or "NO"
}

export interface LoginUser {
  Id: number;
  CompanyName: string;
  Name: string;
  EmailId: string;
  Phone: string;
  Password: string;
  PanCard: string;
  AadharCard: string;
  WLId: string;
  AddressLine1: string;
  AddressLine2: string;
  State: string;
  City: string;
  Pincode: string;
  Pancopy: string;
  AadharFront: string;
  AadharBack: string;
  Recharge: string;
  MoneyTransfer: string;
  AEPS: string;
  BillPayment: string;
  MicroATM: string;
  Status: string;
  AepsStatus: string;
  lat: string;
  longitute: string;
  DeviceID: string;
  TokenKey: string;
  DeviceInfo: string;
  RegDate: string;
  SessionKey: string;
  Usertype: string;   // RT / SuperAdmin / Retailer
  MDId: string;
  ADId: string;
  logo: string;
  TxnPin: string;
  merchageCode: string;
  PlanId: string;
  Username: string;
  ShopAddress: string;
  ShopState: string;
  ShopCity: string;
  ShipZipcode: string;
  latlongstatus: string;
}

export interface PermissionItem {
  Id: number;
  ServiceName: string;
  Status: string;      // Active / DeActive
  Category: string;
}


export interface OTPSuccessResponse {
  message: string;
  success: boolean;
}
