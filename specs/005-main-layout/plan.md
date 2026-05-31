# Implementation Plan: Main Layout Application Shell

**Branch**: `005-main-layout` | **Date**: 2026-05-28 | **Spec**: [specs/005-main-layout/spec.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/specs/005-main-layout/spec.md)

---

## Summary

This plan details the technical design and implementation of the authenticated **Main Layout Application Shell** built with React, TypeScript, and **Tailwind CSS v4** (completely replacing Material UI).

All backend API endpoint schemas, request-response payloads, and authority routing contracts needed for dynamic integrations (such as user profiles and administration lookups) are sourced from the centralized [UsersEndpoints.md](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/UsersEndpoints.md) reference contract.

---

## User Review Required

> [!IMPORTANT]
> **Theme Integration (Light / Dark Mode)**:
> In compliance with Core Principle IV of our adopted system constitution (v1.2.0), all layout and nested components must support Light & Dark modes out-of-the-box. We will implement this natively by managing a `theme` state (`light` / `dark`) at the layout boundary and toggling the `"dark"` class on the document root element, enabling seamless Tailwind `dark:` utilities.
> 
> Please verify if this matches your visual expectations.

---

## Proposed Changes

We will modify the core route structure and implement the authenticated application layout components under the `LoginApp` Vite project.

```text
LoginApp/src/
├── types/
│   └── navigation.ts       # [NEW] Define type-safe NavigationItem schema for menu rendering
├── navigation/
│   └── menuConfig.ts       # [NEW] Centralized navigation routing config object with claim parameters
├── layouts/
│   └── MainLayout.tsx      # [NEW] Primary authenticated container with Sidebar, Topbar and dynamic Outlet
├── components/
│   ├── Sidebar.tsx         # [NEW] Custom collapsible sidebar with nested lists and CSS transitions
│   ├── Topbar.tsx          # [NEW] Glassmorphic header with menu toggles, page titles, and user profile menus
│   └── ProfileDrawer.tsx   # [NEW] Slide-over absolute panel drawer for self-profile modifications
├── App.tsx                 # [MODIFY] Wrap dashboards and submodules under protected MainLayout nesting
└── pages/
    └── Dashboard.tsx       # [MODIFY] Refactor dashboard dashboard views to fit within MainLayout content
```

---

### 1. Centralized Reusable Navigation Model

#### [NEW] [navigation.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/types/navigation.ts)
*   Define type-safe interfaces for central routing config elements:
    ```typescript
    export interface NavigationItem {
      label: string;
      path?: string;
      icon: React.ReactNode;
      roles?: string[];         // Future role-based access filtering
      permissions?: string[];   // Future permission-based access filtering
      children?: NavigationItem[];
    }
    ```

#### [NEW] [menuConfig.ts](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/navigation/menuConfig.ts)
*   Declare a centralized, reusable navigation config array matching your exact spec requirements:
    *   **Dashboard**
    *   **Pacientes** $\rightarrow$ *Grupo Familiar*
    *   **Atención Médica** $\rightarrow$ *Consultas*, *Historial Médico*, *Exámenes*, *Pruebas complementarias*, *Citas*
    *   **Administración (Nested/Collapsible)** $\rightarrow$ *Centros Médicos*, *Tipos de Centro*, *Aseguradoras*, *Médicos*, *Especialidades*, *Usuarios*, *Roles*

---

### 2. Main Authenticated Components & Styling (Tailwind CSS v4 Strategy)

#### [NEW] [Sidebar.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/Sidebar.tsx)
*   Implement the collapsible Left Menu using pure Tailwind CSS flex-column layout.
*   **Responsive Dimensions**:
    *   *Desktop (Expanded)*: `w-64` width (CSS transition: `transition-all duration-300`).
    *   *Desktop (Collapsed)*: `w-18` width (icon-only centered mode).
    *   *Mobile/Tablet*: Hidden by default, toggled as a slide-over drawer overlay (`fixed inset-y-0 left-0 z-50 transform -translate-x-full mobile:translate-x-0`).
*   **Active Highlighting**: Match current path via React Router `useLocation()`. The selected item is styled using a high-contrast premium indigo gradient (`bg-gradient-to-r from-indigo-600 to-brand-500 text-white font-semibold`).
*   **Submenus**: Nested lists are toggled using custom React state (`isOpen`), opening smooth accordion panels (`overflow-hidden transition-all duration-300`).

#### [NEW] [Topbar.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/Topbar.tsx)
*   Implement the header as a premium glassmorphic bar (`backdrop-blur-md bg-slate-950/40 dark:bg-slate-950/40 bg-white/70 border-b border-slate-200/80 dark:border-slate-800/60 sticky top-0 z-45`).
*   Include hamburger togglers, dynamic section titles, and a theme toggler switch (`Light / Dark` mode).
*   Render the active user profile section:
    *   Circular avatar initials block.
    *   Dropdown context menu displaying user name, email, *"Modificar Perfil"*, and *"Cerrar Sesión"*.

#### [NEW] [ProfileDrawer.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/components/ProfileDrawer.tsx)
*   Implement a slide-over Drawer panel (`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-out`).
*   Pre-fills name and email in read-only format, enabling input fields to modify user details.
*   Triggers API updates and success toasts upon validation completion.

#### [NEW] [MainLayout.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/layouts/MainLayout.tsx)
*   Integrate Sidebar and Topbar into a single container structure.
*   Enforce a theme state (`light` / `dark`) and toggle the `"dark"` class on the `document.documentElement` to trigger Tailwind's responsive dark modes.
*   Render a central dynamic area `<main className="flex-1 p-6 overflow-y-auto">` holding React Router's `<Outlet />` to render child components.

---

### 3. Navigation Guards & Route Nesting

#### [MODIFY] [App.tsx](file:///c:/Users/ANTONIO/source/repos/agy-sdd/LoginAPi/LoginApp/src/App.tsx)
*   Refactor routing pathways to wrap all protected dashboards under the new `MainLayout`:
    ```tsx
    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Configure lazy-loaded placeholders for nested submodules */}
    </Route>
    ```

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*   **I. Token-Based Authentication (JWT Bearer)**: ✅ Yes. Layout is guarded under `<ProtectedRoute>` sessions, redirecting unauthenticated visitors immediately back to `/login`.
*   **II. Centralized Axios & Error Handling**: ✅ Yes. Profile updates inside drawers will be routed through the centralized Axios client, handling validation and session expirations gracefully.
*   **III. Centralized State (React Context)**: ✅ Yes. Displays user details (avatar, name, email) dynamically from `AuthContext` and hooks into `logout` functions.
*   **IV. Enterprise Aesthetics (Tailwind CSS v4 & Dark Mode)**: ✅ Yes. Integrates lightweight, clean Tailwind CSS v4 visual layout models, including collapsible animations, light/dark themes, custom side-over drawers, and grid alignments.
*   **V. Decoupled Forms & Validations**: ✅ Yes. The profile update form inside the drawer separates UI layout from form validation schemas, verifying inputs in real-time.
*   **VI. Identity & Access Management (IAM CRUD)**: ✅ Yes. Navigation configuration is claim-aware, paving the way for seamless, claims-filtered navigation overlays in subsequent phases.

---

## Verification Plan

### Automated Tests
*   Execute Vite production compilation with `npm run build` in `LoginApp` to guarantee zero build-time warnings or TS compiler errors.

### Manual Verification
*   Run dev server using `npm run dev`.
*   Perform manual walkthrough checks:
    1.  **Direct Route Bypassing**: Navigate to `/dashboard` while unauthenticated. Confirm you are blocked and routed back to `/login`.
    2.  **Visual Sidebar Folding**: Expand and collapse the left navigation panel on desktop screens. Verify smooth CSS transitions.
    3.  **Active Highlighting**: Navigate across submenus and verify the active route is visually highlighted in the sidebar list.
    4.  **Responsive Layout**: Resize your browser. Verify the sidebar automatically hides on small screens, appearing only when toggled from the Topbar overlay button.
    5.  **Light / Dark Toggle**: Click the theme toggle icon. Verify that all components (Sidebar, Topbar, Drawers) switch colors dynamically.
    6.  **Profile Update slide Drawer**: Open the profile dropdown, click "Modificar Perfil", and verify the slide-over drawer loads from the right with pre-filled inputs.
    7.  **Destructive Logout**: Click "Cerrar Sesión". Verify that session credentials are fully wiped from storage and the user lands on the Login screen.
