export interface RechargePlan {
  rs: number;
  desc: string;
}

export interface RechargePlanResponse {
  code: Number;
  data: RecplanData
}

export interface RecplanData
{
  message: string;
  data: Rcplan2;
}

export interface Rcplan2
{
  tel: string;
  operator: string;
  message: string;
  records: RechargePlan[];
  status: number;
}