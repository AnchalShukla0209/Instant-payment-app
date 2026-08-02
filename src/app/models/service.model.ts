export interface ServiceDto {
  id?: number;
  serviceName: string;
  servicePath: string;
  isActive: boolean;
  isActiveOnApk: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}
