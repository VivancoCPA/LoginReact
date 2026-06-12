# Technical Research: Active Role Selection

## Decisions & Architecture

### 1. State Management for Active Role
- **Decision**: Extend the central authentication state in `AuthContext.tsx` to hold an `activeRole: string | null` field and export a `setActiveRole: (role: string | null) => void` setter.
- **Rationale**: 
  - Storing the active role centrally allows the layout guards, `Sidebar.tsx` navigation link filters, and `Topbar.tsx` user detail badges to dynamically re-evaluate rendering details based on the selected role context.
  - The `activeRole` will be persisted in `localStorage` as `auth_active_role` to maintain role consistency across page refreshes.

### 2. Post-Login Routing Guard
- **Decision**: Integrate active role verification into the `ProtectedRoute` component inside `App.tsx`.
- **Flow**:
  1. User authenticates successfully.
  2. The application checks the list of assigned roles.
  3. If user has exactly **one** role, the system automatically assigns it to `activeRole` and redirects them to the dashboard.
  4. If user has **multiple** roles and `activeRole` is not yet selected, the guard redirects them to `/choose-role`.
  5. Any manual navigation to other routes while `activeRole` is unset is intercepted and redirected back to `/choose-role`.
- **Alternatives Considered**: 
  - Mounting `/choose-role` within the layout (rejected because rendering the sidebar navigation links before a role has been chosen violates security expectations and would look broken/empty).

### 3. Choose Role Screen UX
- **Decision**: Create a dedicated standalone page component `ChooseRole.tsx` that renders outside the primary sidebar layout, matching the login screen aesthetics (sleek dark gradients, clean card selections, and an optional Logout button).
