export interface ServiceDto {
  id?: number;
  serviceName: string;
  servicePath: string;
  isActive: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
}
