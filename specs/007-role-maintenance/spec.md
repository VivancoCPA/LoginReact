# Feature Specification: Role Maintenance (Mantenimiento de Roles)

**Feature Branch**: `007-role-maintenance`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Crear mantenimiento de Roles para ser asignado a los Usaurios desde su propio Mantenimiento. Proveer una interfaz completa para listar, buscar, filtrar, visualizar, editar y crear , con soporte de dos modos de visualización: tabla y tarjetas..."

## Clarifications

### Session 2026-06-02

- Q: ¿El formulario del rol debe incorporar la selección de permisos/claims del sistema, o el alcance actual se limita únicamente al CRUD de Nombre/Descripción? → A: Solo Nombre, Descripción e indicador de Activo/Inactivo. CRUD simple de campos básicos sin mapeo dinámico de claims en el frontend.
- Q: ¿Se debe implementar la funcionalidad de eliminar/inactivar roles, y cuál es la lógica de negocio restrictiva si existen usuarios asignados? → A: Restricción total si hay usuarios. El sistema bloquea la desactivación si el rol tiene usuarios asignados.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - List, Search, and Toggle View of Roles (Priority: P1)

Como Administrador del sistema, quiero poder ver el listado completo de los roles definidos en la plataforma, buscar por término libre y alternar entre visualización de tabla densa y tarjetas responsivas, para gestionar los roles con agilidad.

**Why this priority**: Es la vista principal y el punto de acceso para cualquier operación sobre los roles. Sin ella, no se pueden realizar búsquedas ni seleccionar registros para edición.

**Independent Test**:

- Acceder al panel de "Roles" desde el menú de navegación.
- Digitar un término en el buscador (ej: "Auditor") y confirmar que se filtran en tiempo real tanto en vista tabla como en tarjetas.
- Hacer clic en el selector de vista para alternar entre "Tabla" y "Tarjetas" y refrescar el navegador para verificar que la preferencia se mantiene guardada (persistencia en sesión).

**Acceptance Scenarios**:

1. **Given** un administrador autenticado en la vista de Roles en modo Tabla, **When** digita un nombre que no coincide con ningún rol en el buscador, **Then** el sistema oculta las filas y renderiza un estado vacío con un mensaje ilustrativo ("No se encontraron roles que coincidan con la búsqueda").
2. **Given** un administrador autenticado, **When** hace clic en el ícono de vista de Tarjetas (Cards), **Then** la interfaz cambia inmediatamente a un grid responsive de tarjetas mostrando el Nombre del rol y el número de usuarios Asignados, y guarda esta selección en el almacenamiento de la sesión (`sessionStorage`).

---

### User Story 2 - Create and Edit Roles (Priority: P2)

Como Administrador del sistema, quiero poder crear nuevos roles o modificar la información de roles existentes (tales como nombre y descripción) utilizando un panel lateral deslizante (Drawer), asegurando validaciones en tiempo real para evitar inconsistencias.

**Why this priority**: Permite la mutabilidad de los roles dentro del sistema. La validación en línea previene errores de captura antes de enviar información a la API.

**Independent Test**:

- Presionar el botón "+ Nuevo Rol" para abrir el Drawer de creación.
- Escribir un nombre de rol con menos de 3 caracteres y confirmar que aparece un mensaje de validación visual.
- Completar los campos válidos, hacer clic en "Guardar cambios" y confirmar la notificación emergente de éxito (Toast) y la inserción del nuevo rol en la vista principal.

**Acceptance Scenarios**:

1. **Given** el Drawer de creación/edición de rol abierto, **When** el administrador deja en blanco el campo obligatorio "Nombre", **Then** el sistema deshabilita el botón de enviar y muestra un mensaje de advertencia bajo el input ("El nombre del rol es requerido").
2. **Given** un formulario de rol con datos modificados válidos, **When** el administrador hace clic en "Guardar cambios", **Then** el sistema muestra un indicador de carga, procesa la actualización con la API, cierra el Drawer automáticamente y despliega un Toast notificando el éxito de la operación.

---

### User Story 3 - Role Management and System Impact (Priority: P3)

Como Administrador del sistema, quiero que cualquier cambio realizado en los roles (creación, edición o eliminación) se refleje inmediatamente en los selectores del mantenimiento de usuarios, garantizando consistencia en las asignaciones de control de acceso.

**Why this priority**: Une el mantenimiento de roles con el flujo de negocio principal del mantenimiento de usuarios (`UserRolesDialog`), garantizando que la base de datos de control de accesos (RBAC) sea consistente.

**Independent Test**:

- Crear un rol nuevo (ej: "Supervisor").
- Ir al módulo de Gestión de Usuarios, abrir el panel "Roles" de cualquier usuario y verificar que el nuevo rol "Supervisor" se lista automáticamente como opción para asignación.

**Acceptance Scenarios**:

1. **Given** un rol modificado en su nombre, **When** un administrador abre las propiedades de un usuario que ya tenía ese rol, **Then** el nuevo nombre del rol se renderiza correctamente reflejando la actualización global sin pérdida de asignaciones previas.

---

### Edge Cases

- **Colisiones de Nombre**: ¿Qué sucede cuando un administrador intenta crear o renombrar un rol con un nombre idéntico a uno que ya existe? El sistema debe capturar el error `409 Conflict` devuelto por el backend y renderizar un mensaje de error claro al pie del input de Nombre ("Ya existe un rol registrado con este nombre").
- **Roles del Sistema Protegidos**: ¿Cómo se gestionan los roles predeterminados críticos (ej. `Admin` o `User`)? El sistema debe bloquear la edición del nombre o la eliminación de estos roles "base" del sistema para prevenir que la consola quede inaccesible.
- **Roles con Alta Demanda de Usuarios**: Si un rol tiene miles de usuarios asignados, la renderización de la tarjeta debe manejar de forma elegante las cifras de asignación, formateando números grandes apropiadamente si excede el millar.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El sistema MUST listar todos los roles activos del sistema mostrando Nombre del rol y cantidad de usuarios Asignados.
- **FR-002**: El sistema MUST permitir la búsqueda interactiva en tiempo real a través de un input de texto libre en la barra de herramientas principal.
- **FR-003**: El sistema MUST soportar dos modos de visualización simultáneos y conmutables (Tabla densa y Tarjetas responsivas) persistiendo la selección a través de `sessionStorage`.
- **FR-004**: En vista Tabla, el sistema MUST ofrecer ordenación ascendente y descendente en las columnas "Nombre" y "Asignados".
- **FR-005**: En vista Tarjetas, el sistema MUST estructurarse en un Grid responsive (3 columnas en pantallas grandes de escritorio, 2 en tablets y 1 en dispositivos móviles).
- **FR-006**: Las acciones de creación y edición MUST realizarse a través de un panel lateral deslizante (Drawer) alineado al lado derecho de la pantalla, manteniendo la consistencia de interfaz con el Mantenimiento de Usuarios.
- **FR-007**: El formulario de rol MUST incluir validación en tiempo real (por ejemplo, longitud mínima del nombre de 3 caracteres y obligatoriedad).
- **FR-008**: El sistema MUST manejar de forma segura las operaciones asíncronas con la API de backend, mostrando estados visuales de carga (skeletons y spinners) y deshabilitando botones para evitar envíos dobles.
- **FR-009**: El formulario del rol está limitado únicamente a los campos de Nombre, Descripción e indicador Activo/Inactivo; los permisos y claims específicos asociados a cada rol se resuelven de forma estática en la lógica del backend/código.
- **FR-010**: El sistema MUST permitir la Inactividad de roles únicamente cuando la cantidad de usuarios asignados sea cero (`assignedUsersCount === 0`); si existen usuarios asignados, la acción de desactivacion debe bloquearse o ser rechazada con un mensaje de validación claro.

### Key Entities

- **Role (Rol)**: Representa un perfil de acceso o permiso administrativo en la plataforma.
  - Atributos clave:
    - `id` (Identificador único de rol)
    - `name` (Nombre único, ej. "Auditor")
    - `description` (Descripción descriptiva de sus facultades)
    - `isAtive` (Bandera booleana que indica si un rol esta Activo/Inactivo)
    - `assignedUsersCount` (Cálculo numérico de usuarios activos asociados a este rol)
    - `isSystemRole` (Bandera booleana para proteger roles core de edición/borrado)

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Un administrador puede alternar la vista (Tabla / Tarjetas) en menos de 100 milisegundos, y la preferencia cargará instantáneamente al reiniciar la sesión.
- **SC-050**: El filtrado por buscador interactivo de texto libre debe procesar y actualizar la lista en pantalla en menos de 150 milisegundos desde que el usuario deja de escribir.
- **SC-003**: La creación o edición de un rol se procesa y confirma en la interfaz mediante Toast en menos de 1.5 segundos (dependiendo de la latencia del backend).
- **SC-004**: El 100% de los intentos de ingresar un nombre duplicado de rol deben ser prevenidos o rechazados con un mensaje descriptivo en pantalla en lugar de provocar fallos genéricos de base de datos.

---

## Assumptions

- **A-001**: Los roles preexistentes en la base de datos (`Admin`, `User`, `Auditor`, `Asegurador`) están precargados y se utilizarán para la visualización inicial de datos.
- **A-002**: El conteo de usuarios asignados se resolverá de forma óptima a través de un campo calculado o agregación en el backend, por lo que la vista de Roles no requiere cargar el listado completo de identidades de usuarios para mostrar la cifra.
- **A-003**: La comunicación se realiza sobre el mismo protocolo REST seguro ya establecido en la plataforma utilizando tokens JWT portados en la cabecera Axios.
