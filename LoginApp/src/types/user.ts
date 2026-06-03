export interface InsuranceItem {
  insurerId: string;
  insurerName: string;
  insurerPhone?: string;
  insurerEmail?: string;
  logoUrl?: string;
}

export interface PagedUserItem {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  photoUrl?: string;
  address?: string;
  emailConfirmed: boolean;
  isLockedOut: boolean;
  createdAt: string;
  lastAccess?: string;
  passwordConfirmed: boolean;
  familyGroupId?: string;
  familyGroupName?: string;
  insurances?: InsuranceItem[];
}

export interface PaginatedUsersResult {
  items: PagedUserItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface FamilyGroup {
  id: string;
  name: string;
  userId: string;
  ownerName: string;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
}
