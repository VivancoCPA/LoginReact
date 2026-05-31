# Data Model Design: User Maintenance (Gestión de Usuarios)

This document maps out the client-side data schemas, TypeScript model interfaces, validation boundaries, and reactive form states supporting the **User Maintenance** CRUD flows.

---

## 1. Type-Safe Client Interfaces

We declare the models in `LoginApp/src/types/user.ts`.

### 1.1 User Item Model (`PagedUserItem`)
Renders in paged lists, cards, and pre-fills details inside read-only Views.

```typescript
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
  familyGroupId?: string;
  familyGroupName?: string;
  insurances?: Array<{
    insurerId: string;
    insurerName: string;
    insurerPhone?: string;
    insurerEmail?: string;
    logoUrl?: string;
  }>;
}
```

### 1.2 Paginated Result DTO (`PaginatedUsersResult`)
Wraps paginated API replies.

```typescript
export interface PaginatedUsersResult {
  items: PagedUserItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

### 1.3 Family Group Model (`FamilyGroup`)
Obtained from the `/api/family-groups` active check calls.

```typescript
export interface FamilyGroup {
  id: string;
  name: string;
  userId: string;
  ownerName: string;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
}
```

---

## 2. Interactive Form States (View $\leftrightarrow$ Create $\leftrightarrow$ Edit)

We manage form inputs in `UserDrawer.tsx` via state hooks representing fields to submit:

```typescript
interface UserFormState {
  email: string;        // Locked in Edit mode, editable/required in Create mode
  name: string;         // Required (length >= 2)
  lastName: string;     // Required (length >= 2)
  phone: string;        // Optional, numeric format
  dob: string;          // Optional, YYYY-MM-DD
  address: string;      // Optional
  familyGroupId: string;// Locked in Edit/Create mode (assigned externally)
  photoUrl: string;     // Preview URL or backend URL
}
```

### 2.1 File State Hook
Manages the selected file and preview state:
*   `selectedFile`: `File | null` - Holds the file binary to upload (Max 2MB limit validation).
*   `previewUrl`: `string | null` - Transient preview url (`URL.createObjectURL(file)`) showing in the top header.

---

## 3. Form Validations

Form submissions are protected by strict validations:
*   **Name & Surname**: Evaluated on-change, must not be blank, and must be $\ge 2$ characters.
*   **Email**: Enforces format match (regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`). In Create Mode, must undergo uniqueness verification.
*   **Phone**: Optional, validates optional numerical digits.
*   **Avatar Image**: Checked on-change (size must be $\le 2097152$ bytes).
