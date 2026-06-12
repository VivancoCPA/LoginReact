# Data Model: Unscoped Users

## TypeScript Interfaces

### Unscoped User Model
Represents the structure returned by `GET /api/users/unscoped` as documented in `UsersEndpoints.md`.

```typescript
export interface UnscopedUser {
  id: string;
  email: string;
  name: string;
  lastName: string;
  fullName: string;
}
```

## Form State & Validation Schema

The Search input uses a simple text search term:
- **SearchTerm**: `string` (no special client-side validations required, standard case-insensitive substring matching against `fullName` or `email`).
