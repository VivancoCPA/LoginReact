export interface InsurerItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  personInCharge?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  insuredUsersCount?: number;
}

export interface PaginatedInsurersResult {
  items: InsurerItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
