export interface SpecialtyItem {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface PaginatedSpecialtiesResult {
  items: SpecialtyItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
