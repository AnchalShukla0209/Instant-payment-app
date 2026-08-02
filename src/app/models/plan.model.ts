export interface PlanDto {
  id?: number;
  planName: string;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface PlanListResponse {
  success: boolean;
  data: PlanDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface PlanResponse {
  success: boolean;
  data: PlanDto;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
