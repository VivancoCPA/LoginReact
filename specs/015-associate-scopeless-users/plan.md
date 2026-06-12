# Implementation Plan: Unscoped Users Association

**Branch**: `015-associate-scopeless-users` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-associate-scopeless-users/spec.md` and [UsersEndpoints.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/UsersEndpoints.md)

---

## Summary

This plan details the fix for the Scope Association drawer:
1. **API Service updates**: Add the missing `getUnscopedUsers()` client endpoint calling `/users/unscoped`.
2. **Drawer integration**: Replace the current incorrect filter flow inside `UserScopeDrawer.tsx` with a direct call to the new service endpoint, ensuring users are listed correctly rather than appearing as empty.
3. **UX & Search Validation**: Ensure search filters function correctly against `fullName` / `email` and individual association remains functional.

---

## Technical Context

- **Language/Version**: React 19 + TypeScript + Vite.
- **Primary Dependencies**: Axios + Tailwind CSS v4 + React Hot Toast.
- **Storage**: Centralized REST API endpoint `/api/users/unscoped`.
- **Testing**: Vite production compilation checks (`npm run build`).
- **Target Platform**: Responsive Web browsers.
- **Constraints**: 
  - Standard Admins call `/api/users/unscoped` to see all users currently without an active scope.
  - Associations are made individually via `POST /api/users/{adminId}/scope/{userId}`.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Token-Based Authentication**: Reuses global authorization token in `apiClient` to request endpoints.
- **Centralized Axios**: Routes endpoints through `apiClient`.
- **Decoupled Validations**: Substring filtering is done client-side safely.
- **Enterprise Aesthetics (Tailwind CSS v4)**: Reuses the existing drawer styles, adding appropriate loading spinners and empty states.

---

## Project Structure

### Documentation (this feature)

```text
specs/015-associate-scopeless-users/
├── spec.md              # Functional specification
├── plan.md              # This file
├── research.md          # Technical decisions and endpoints mapping
├── data-model.md        # TypeScript interfaces and models
├── quickstart.md        # Integration testing scenarios
└── contracts/
    └── ui-contracts.md  # API/UI contract layouts
```

### Source Code (repository root)

```text
LoginApp/
└── src/
    ├── services/
    │   └── userService.ts          # [MODIFY] Add getUnscopedUsers API call
    └── components/
        └── UserScopeDrawer.tsx     # [MODIFY] Fetch unscoped users directly and handle search
```

**Structure Decision**: Changes are localized to the services layer and the scope drawer component.

---

## Proposed Changes

### Users Service

#### [MODIFY] [userService.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/services/userService.ts)
- Add `getUnscopedUsers` method that queries `GET /users/unscoped`.

### Components

#### [MODIFY] [UserScopeDrawer.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/UserScopeDrawer.tsx)
- Change `fetchScopelessUsers` to invoke `userService.getUnscopedUsers()`.
- Remove the local filtering logic that subtracts `scopedUsers` since the endpoint already returns exactly the unscoped set.
- Map the returned users which do not contain `photoUrl` gracefully.

---

## Verification Plan

### Automated Tests
- Verify TypeScript and Vite bundle production compilation succeeds with no warnings:
  ```bash
  npm run build
  ```

### Manual Verification
1. Log in as `Admin`, click "Asociar Scope".
2. Check that the loader spinner runs and then populates the drawer with the list of unscoped users.
3. Test search filter inputs (e.g. filter by name or email).
4. Click "Asociar" on a user row, check success toast, verify they are removed from the drawer and visible on the main list.
