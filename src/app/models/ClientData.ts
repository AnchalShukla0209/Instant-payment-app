export interface GetUsersWithMainBalanceQuery {
  pageIndex: number;
  pageSize: number;
  fromDate?: string;
  toDate?: string;
}

export interface GetUsersWithMainBalanceResponse {
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  totalBalance: number;
  users: UserModel[];
}

export interface UserModel {
  id: number;
  userName: string;
  companyName: string;
  domain: string;
  city: string;
  mainBalance: number;
  status: string;
  emailId: string;
}