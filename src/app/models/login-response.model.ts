export interface LoginResponse {
  Token: string;
  Username: string;
  Usertype: string;
  OTP: string;
  IsOtpRequired: boolean;
  messaege: string
}

export interface OTPSuccessResponse {
  message: string;
  success: boolean;
}
