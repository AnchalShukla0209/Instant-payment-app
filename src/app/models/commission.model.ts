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
