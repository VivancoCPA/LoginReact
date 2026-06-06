# Data Model & Validations: Family Groups

This document outlines the TypeScript interfaces, form schemas, and field validation constraints for the **Family Groups** feature.

---

## 1. Core Data Interfaces

These interfaces correspond to the responses returned by the backend endpoints.

```typescript
export interface RelationshipLookup {
  id: string;   // e.g. "MADRE", "PADRE", "HIJO_A", "HERMANO_A", "CONYUGE"
  label: string; // e.g. "Madre", "Padre", "Hijo/a", "Hermano/a", "Cónyuge"
}

export interface FamilyMembershipItem {
  id: number;
  userId: string;
  userEmail?: string; // or email
  userName?: string;  // or name
  userLastName?: string; // or lastName
  userPhotoUrl?: string; // or photoUrl
  isAdmin: boolean;
  relationship: string; // matches lookup id
  isActive: boolean; // logical activation state
}

export interface FamilyExtraMembershipItem {
  id: number;
  fullName: string;
  idType: string; // e.g. "DNI", "Pasaporte"
  photoUrl: string | null;
  familyGroupId: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface FamilyGroupItem {
  id: string; // GUID v7
  name: string;
  userId: string; // owner user ID (GUID)
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
```

---

## 2. Form Payload Models

Payloads for creations and updates.

### A. Family Group Form
```typescript
export interface FamilyGroupFormModel {
  name: string;
  userId: string; // Owner ID
  photo: File | null;
  isActive?: boolean;
}
```

### B. Member Assignment Form
```typescript
export interface MemberFormModel {
  userId: string;
  isAdmin: boolean;
  relationship: string;
}
```

### C. Extra Member Form
```typescript
export interface ExtraMemberFormModel {
  fullName: string;
  idType: string;
  description?: string;
  photo: File | null;
  isActive?: boolean;
}
```

---

## 3. Field Validations & Rules

### A. Family Group Validations
- `name`: Required, string, between 2 and 200 characters.
- `userId`: Required, string (GUID).
- `photo`: Optional, binary file. Size validation: must be <= 2MB. Extensions: `.jpg`, `.jpeg`, `.png`, `.webp`.

### B. Family Member Validations
- `userId`: Required, string (GUID).
- `relationship`: Required, string, must match one of the lookup IDs from `/api/relationships`.
- **Duplicate Prevention**: Before submitting, ensure that `userId` is not already a member of the current group (throw client-side alert).
- **Admin Limit**: Ensure that `isAdmin = true` is only assigned to one member of the group (if the user tries to assign a second member as admin, throw an alert).

### C. Extra Member Validations
- `fullName`: Required, string, between 2 and 200 characters.
- `idType`: Required, string, e.g. "DNI", "CE", "Pasaporte", maximum 50 characters.
- `description`: Optional, string, maximum 500 characters.
- `photo`: Optional, binary file, <= 2MB.
