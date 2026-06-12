# UI Contracts: User Scope Management

## 1. Topbar Profile Info
The `Topbar` component contract will incorporate dynamic rendering:
- **Display own avatar**: Renders `<img>` if `user.photoUrl` exists, otherwise falls back to `getInitials()`.
- **Display role**: Renders `user.roles[0]` adjacent to name on desktop, and inside the dropdown menu panel header.

## 2. UserScopeDrawer Component
A new drawer slide-over component `UserScopeDrawer.tsx` will be created with the following properties:

```typescript
interface UserScopeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}
```

### Behaviors:
- **Load Scopeless Users**: Requests all users from `/api/users` and compares them against associated scopes, or requests a scoped lists to find users without any scope.
- **Associate Action**: Sends `POST /api/users/{adminId}/scope/{userId}` to associate a user to the current Admin's scope.
- **Form/Table styling**: Renders in a sliding panel, maintaining Tailwind CSS v4 aesthetic rules.

## 3. Disassociation Actions in UserMaintenance
- **Standard Admin**: Renders a "Desasociar del Scope" button in the action column. Clicking displays a `ConfirmDialog` before calling `DELETE /api/users/{adminId}/scope/{userId}`.
- **SuperAdmin**: Hides the "Desasociar del Scope" option (SuperAdmin handles global user controls and has no scope bindings).
