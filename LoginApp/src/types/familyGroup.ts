export interface RelationshipLookup {
  id: string;   // e.g. "MADRE", "PADRE", "HIJO_A", "HERMANO_A", "CONYUGE"
  label: string; // e.g. "Madre", "Padre", "Hijo/a", "Hermano/a", "Cónyuge"
}

export interface FamilyMembershipItem {
  id: number;
  userId: string;
  userEmail?: string;
  userName?: string;
  userLastName?: string;
  userPhotoUrl?: string;
  isAdmin: boolean;
  relationship: string;
  isActive: boolean;
}

export interface FamilyExtraMembershipItem {
  id: number;
  fullName: string;
  idType: string;
  photoUrl: string | null;
  familyGroupId: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface FamilyGroupItem {
  id: string; // GUID v7
  name: string;
  userId: string; // Owner user ID
  ownerName: string;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  members?: FamilyMembershipItem[];
  extraMembers?: FamilyExtraMembershipItem[];
}

export interface PaginatedFamilyGroupsResult {
  items: FamilyGroupItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
