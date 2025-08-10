export interface GetUsersWithMainBalanceQuery {
  pageIndex: number;
  pageSize: number;
  fromDate?: string;
  toDate?: string;
  ClientId?: number
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

export interface GetClientUsersWithMainBalanceResponse {
  totalRecords: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  totalBalance: number;
  users: ClientUserModel[];
}

export interface ClientUserModel {
  id: number;
  userName: string;
  companyName: string;
  phone: string;
  createdDate: Date;
  userType: string;
  city: string;
  mainBalance: number;
  status: string;
  emailId: string;
  planName: string;
  mdname : string;
  adname : string;
}
