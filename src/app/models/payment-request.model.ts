export interface PaymentRequestDto {
  bankId: string;
  userId: number;
  amount: number;
  txnId: string;
  deposideMode?: string;
  txnSlip?: File | null;
}

export interface PaymentResponse {
  paymentId: string;
  txnId?: string;
  userName?: string;
  userType?: string;
  bankName?: string;
  accountNo?: string;
  amount: number;
  depositeMode?: string;
  txnSlipFileName?: string;
  txnSlipPath?: string;
  status?: string;
  adminRemarks?: string;
}

export interface PaymentUpdateRequest {
  paymentId: string;
  status?: string;
  adminRemarks?: string;
  modifiedBy: number;
}

export interface PaginatedPaymentResponse {
  payments: PaymentResponse[];
  totalCount: number;
}
