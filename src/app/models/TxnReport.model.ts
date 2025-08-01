export interface TxnReportPayload {
  serviceType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: number;
  pageIndex?: number;
  pageSize?: number;
}

export interface TxnReportData {
  id: number;
  txn_ID?: string;
  bankRefNo?: string;
  userName?: string;
  operatorName?: string;
  accountNo?: string;
  openingBal?: number;
  amount?: number;
  closing?: number;
  status?: string;
  apiName?: string;
  comingFrom?: string;
  masterDistributor?: string;
  distributor?: string;
  timeStamp?: string;
  updatedTime?: string;
  success?: string;
  failed?: string;
  apiRes?: string;
  totalTransactions?: number;
  totalAmount?: number;
  flagforTrans?: number;
}

export interface PaginatedTxnResultDto {
  data: TxnReportData[];
  totalTransactions: number;
  totalAmount: number;
  flagForTrans: number;
}