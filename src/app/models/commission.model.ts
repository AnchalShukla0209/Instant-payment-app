// slab-info.dto.ts
export interface SlabInfoDto {
  id: number;
  serviceName: string;
  slabName: string;
  ipShare: number;
  wlShare: number;
  commissionType: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

// update-commission-result.ts
export interface UpdateCommissionResult {
  errorMsg: string;
  flag: boolean;
}

// Commission Slab Models
export interface CommissionSlabDto {
  id?: number;
  planId: number;
  slabRange: string;
  adminShare: number;
  wlAdminShare: number;
  mdShare: number;
  adShare: number;
  rtShare: number;
  commissionType: string;
  serviceId: number;
  apiCode: string;
  operatorId?: number | null;
  createdBy?: string;
  createdAt?: string;
  planName?: string;
}

export interface PlanDropdownDto {
  id: number;
  planName: string;
}

export interface PlanDropdownResponse {
  success: boolean;
  data: PlanDropdownDto[];
}

export interface ServiceDropdownDto {
  id: number;
  serviceName: string;
  icon: string;
}

export interface OperatorDropdownDto {
  id: number;
  operatorName: string;
  spkey: string;
  picture: string;
}

export interface ApiCodeDropdownDto {
  id: number;
  apiCodeValue: string;
  name: string;
}

export interface ApiCodeDropdownResponse {
  success: boolean;
  data: ApiCodeDropdownDto[];
}

export interface CommissionSlabResponse {
  success: boolean;
  data: CommissionSlabDto;
}

export interface CommissionSlabListResponse {
  success: boolean;
  data: CommissionSlabDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface CommissionSlabDeleteResponse {
  success: boolean;
  message: string;
}
