# UI Contracts: Active Role Selection Screen

This document details the route schemas and contract details for the role selection screen.

## 1. Choose Role View Contract
- **Path**: `/choose-role`
- **Render Context**: Outside primary layout (no Sidebar, no Topbar).
- **Layout Styling**: Uses central card panel design identical to login/recover pages (glassmorphism cards, slate-900 background, indigo primary accents).
- **Components**:
  - **Header**: Displays user greeting and instructions to select a role.
  - **Roles Grid**: Renders a list of clickable cards.
    - Each card displays `role.name` and `role.description` (using a lookup map to translate technical names to local descriptions if needed, or using descriptions returned by the role metadata).
  - **Footer Actions**: Contains a "Cerrar Sesión" (Logout) button styled in soft red colors to allow logging out before entering the application.

## 2. Global State context contract
- **Key**: `activeRole` (string | null)
- **Functions**: `setActiveRole(roleName: string | null): void`
- **Local Storage Key**: `auth_active_role`
