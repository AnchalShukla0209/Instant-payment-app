export interface RechargeRequest {
  UserId: Number;
  userName: string;
  MobileNumber: string;
  Operator: string;
  operatorCode?: string;
  Amount: number;
  TxnPin: string;
  Type: string;
  CustomerRefNo: string;
}
