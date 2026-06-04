export interface MedicalCenterItem {
  id: string;               // UUID v7 unique identifier
  name: string;             // Name of the medical center
  typeId?: number;          // ID of the center type (references center_types.id)
  typeName?: string;        // Lookup name of the center type
  address?: string;         // Physical address
  phone?: string;           // Contact phone number
  isActive: boolean;        // Logical deletion state flag
  latitude?: number;        // Geographic latitude coordinate
  longitude?: number;       // Geographic longitude coordinate
  createdAt?: string;       // ISO timestamp
  updatedAt?: string;       // ISO timestamp
}

export interface PaginatedMedicalCentersResult {
  items: MedicalCenterItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
