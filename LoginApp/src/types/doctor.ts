export interface DoctorCenterAssociation {
  id: string;             // UUID v7 of the associated medical center
  name?: string;          // Lookup name of the medical center
  officeNumber?: string;  // Specific office/consultorio info
  workSchedule?: string;  // Custom schedule in this center
}

export interface DoctorItem {
  id: string;               // UUID v7 unique identifier
  name: string;             // First name of the doctor
  lastName: string;         // Last name of the doctor
  specialtyId?: number;     // ID of the medical specialty (references specialties.id)
  specialtyName?: string;   // Lookup name of the specialty
  register?: string;        // Professional license/colegiatura (CMP)
  phone?: string;           // Optional contact number
  email?: string;           // Unique email address
  photoUrl?: string;        // profile photo relative/absolute path
  isVet: boolean;           // True if doctor handles veterinary care
  isActive: boolean;        // Logical activation state flag
  createdAt?: string;       // ISO timestamp
  updatedAt?: string;       // ISO timestamp
  centers: DoctorCenterAssociation[]; // Associated medical center affiliations
}

export interface PaginatedDoctorsResult {
  items: DoctorItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface DoctorAffiliationItem {
  id: number;             // Auto-incremental primary key
  doctorId: string;       // Doctor UUID v7
  doctorName?: string;
  centerId: string;       // Medical Center UUID v7
  centerName?: string;
  officeNumber?: string;
  workSchedule?: string;
  createdAt?: string;
}
