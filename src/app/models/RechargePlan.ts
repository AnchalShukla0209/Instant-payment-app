export interface RechargePlan {
  rs: number;
  desc: string;
}

export interface RechargePlanResponse {
  tel: string;
  operator: string;
  records: RechargePlan[];
  status: number;
  time: number;
}