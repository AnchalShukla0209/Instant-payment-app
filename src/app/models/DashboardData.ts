export interface DashboardData {
  walletAmount: number;
  services: {
    serviceName: string;
    serviceImagePath: string;
  }[];
  totalTransection: number;
  userJoined: number;
}
