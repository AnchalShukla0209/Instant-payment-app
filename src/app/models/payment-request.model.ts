export interface PaymentRequestDto {
  bankId: string;
  userId: number;
  amount: number;
  paymentTxnId: string;
  deposideMode?: string;
  txnSlip?: File | null;
  userRemarks?: string;
}

export interface PaymentResponse {
  paymentId: string;
  txnId?: string;
  userName?: string;
  userType?: string;
  openingBalance?: string;
  closingBalance?: string;
  bankName?: string;
  accountNo?: string;
  amount: number;
  depositeMode?: string;
  txnSlipFileName?: string;
  txnSlipPath?: string;
  status?: string;
  adminRemarks?: string;
  userRemarks?: string;
  paymentTxnId?: string;
  txnDate?: Date;
  txnApprovedDate?: Date;
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
