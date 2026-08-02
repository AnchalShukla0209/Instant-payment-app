export interface LoginPayload {
  UserName: string;
  Password: string;
  lat: string;
  long: string;
  ApiKey: string;
  DeviceID: string;
  TokenKey: string;
  DeviceInfo: string;
  BrowserFingerprint: string;
}
export interface JwtPayload {
  userid: string;
  username: string;
  usertype: string;
}
export interface OTPPayload {
  usertype: string;
  userid: string;
  otp: string;
}
