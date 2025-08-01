export interface ServiceMasterDTO {
  services: { serviceName: string; serviceId: number }[];
  walletAmount: number;
  totalUserJoined: number;
  totalTransection: number;
  pieData: number[];
  lineData: number[];
  lineLabels: string[];
}

export interface Superadmindashboardpayload {
  ServiceId?: number;
  Year?: number;
}