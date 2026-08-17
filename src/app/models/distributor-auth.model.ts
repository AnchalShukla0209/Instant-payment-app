export type PartnerUserType = 'AD' | 'MD' | 'ST';

export interface DistributorLoginRequest {
  username: string;
  password: string;
  platform: 'web';
  deviceId: string;
}

export interface DistributorLoginChallenge {
  otpRequired: boolean;
  challengeId: string | null;
  maskedMobile: string | null;
  expiresInSeconds: number;
  session: DistributorSession | null;
}

export interface DistributorOtpRequest {
  challengeId: string;
  otp: string;
}

export interface DistributorSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  userId: string;
  username: string;
  userType: PartnerUserType;
  displayName: string;
  lastLoginAt: string;
  ipAddress: string;
  expiresAt: number;
}

export interface ApiProblem {
  title?: string;
  status?: number;
  code?: string;
  traceId?: string;
}
