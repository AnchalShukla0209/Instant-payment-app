export interface BankDto {
  bankId: string;          // Guid from backend
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  phoneNo: string;
  txnCharge: number;
  isActive: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
