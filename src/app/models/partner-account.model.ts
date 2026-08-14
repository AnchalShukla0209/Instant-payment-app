export interface PartnerAccountProfile {
  name: string;
  username: string;
  phone: string;
  panCard: string;
  aadharCard: string;
}

export interface PartnerAccountResponse {
  success: boolean;
  message: string;
}

export interface PartnerChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  otp: string;
}

export interface PartnerChangeMpinPayload {
  mpin: string;
  otp: string;
}

export interface PartnerChangeTxnPinPayload {
  txnPin: string;
  otp: string;
}
