import { PartnerUserType } from './distributor-auth.model';

export interface PartnerStatusSummary {
  status: 'Success' | 'Pending' | 'Failed' | 'Process';
  count: number;
  amount: number;
}

export interface PartnerChartPoint {
  date: string;
  success: number;
  pending: number;
  failed: number;
  process: number;
}

export interface PartnerRecentUser {
  userId: number;
  name: string;
  username: string;
  userType: string;
  status: string;
  onboardedAt: string | null;
}

export interface PartnerPaymentRequest {
  paymentId: string | null;
  userId: number;
  userName: string;
  amount: number;
  status: string;
  depositMode: string;
  transactionId: string;
  createdOn: string | null;
}

export interface PartnerDashboard {
  userType: PartnerUserType;
  totalUsers: number;
  walletAmount: number;
  todayTransactionAmount: number;
  todayStatusSummary: PartnerStatusSummary[];
  transactionChart: PartnerChartPoint[];
  recentUsers: PartnerRecentUser[];
  recentPaymentRequests: PartnerPaymentRequest[];
  generatedAtUtc: string;
}

export interface PartnerWallet {
  walletAmount: number;
  refreshedAtUtc: string;
}
