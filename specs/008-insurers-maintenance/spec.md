# Feature Specification: Insurers Maintenance (Mantenimiento de Aseguradoras)

**Feature Branch**: `008-insurers-maintenance`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Crear el mantenimiento de Aseguradoras con acceso autorizado a la aplicación siguiendo el diseño empresarial de la aplicación. Objetivo: Proveer una interfaz completa para listar, buscar, filtrar, visualizar, editar, crear y desactivar aseguradoras, con soporte de dos modos de visualización: tabla y tarjetas..."


## Clarifications

### Session 2026-06-03
- Q: ¿Qué formato o reglas de validación adicionales debemos aplicar al campo de Teléfono en la interfaz? → A: Solo permitir dígitos numéricos y opcionalmente un prefijo `+` al inicio.
- Q: ¿La foto se envía como IFormFile en la creación? → A: Sí, se envía mediante `FormData` con el campo `photo` en la creación (`POST`). En la actualización (`PUT`) se envía un JSON estándar con el campo `logoUrl`.
- Q: ¿Debemos bloquear o restringir la desactivación de la aseguradora si cuenta con usuarios asociados? → A: Permitir la desactivación, pero si tiene usuarios asignados (`insuredUsersCount > 0`), agregar un mensaje de advertencia adicional en el diálogo de confirmación indicando el número de usuarios afectados.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List, Search, Filter, and Toggle Layout of Insurers (Priority: P1)

Como Administrador autorizado, quiero ver el listado de las aseguradoras registradas en el sistema, realizar búsquedas rápidas, filtrar por su estado de actividad y alternar entre vistas de tabla y tarjetas, para administrar y auditar las aseguradoras con facilidad.

**Why this priority**: Es la vista principal y el portal de entrada para cualquier otra operación. Es necesaria para el Producto Mínimo Viable (MVP).

**Independent Test**:
- Acceder al panel de "Aseguradoras" desde el menú principal.
- Alternar la vista entre "Tabla" y "Tarjetas" y refrescar el navegador para comprobar que la selección persiste (`insurersLayoutSelection` en `sessionStorage`).
- Escribir un criterio en la barra de búsqueda (ej: nombre o contacto) y comprobar que la lista se filtra en tiempo real.
- Cambiar el filtro de estado ("Todos", "Activos", "Inactivos") y verificar la acumulación (AND) de filtros.

**Acceptance Scenarios**:
1. **Given** un administrador en la vista de Aseguradoras, **When** selecciona el modo "Tarjetas" (Cards), **Then** la interfaz muestra las aseguradoras en un grid responsivo (3 columnas en desktop, 2 en tablet, 1 en mobile) que expone su avatar, nombre, dirección, teléfono, contacto y estado.
2. **Given** un administrador filtrando por estado "Activos", **When** digita un término de búsqueda en la barra, **Then** la lista se actualiza mostrando únicamente las aseguradoras activas que coincidan con dicho término (filtro acumulativo AND).
3. **Given** una búsqueda sin coincidencias, **When** se completa el filtrado, **Then** se muestra un estado vacío con un mensaje informativo indicando que no hay resultados.

---

### User Story 2 - Create and Edit Insurer Details (Priority: P2)

Como Administrador del sistema, deseo poder dar de alta nuevas aseguradoras o actualizar la información de las existentes mediante un formulario interactivo en panel lateral deslizante (Drawer), asegurando validaciones inmediatas para mantener la integridad de los datos.

**Why this priority**: Permite ingresar y actualizar los datos fundamentales del negocio para la facturación y convenios de los usuarios.

**Independent Test**:
- Presionar "+ Nueva Aseguradora" para abrir el Drawer con campos vacíos.
- Escribir datos inválidos (nombre de 1 carácter, email mal estructurado) y verificar que los mensajes de error impidan el envío.
- Completar campos válidos, guardar y confirmar que se muestra una notificación emergente (Toast) de éxito y la lista se actualiza.
- Seleccionar "Editar" en una aseguradora existente, modificar campos y guardar, verificando que se persistan los cambios.

**Acceptance Scenarios**:
1. **Given** el formulario de creación abierto, **When** el administrador ingresa un email con formato inválido o un nombre de menos de 2 caracteres, **Then** la interfaz resalta los campos con advertencias en línea y deshabilita el botón de confirmación.
2. **Given** una aseguradora en modo edición, **When** el administrador presiona "Cancelar" o hace clic fuera del panel, **Then** el Drawer se cierra sin guardar cambios y no altera la información existente.

---

### User Story 3 - View Detailed Insurer Record and Read-Only Info (Priority: P3)

Como Administrador, quiero abrir una vista de solo lectura detallada de una aseguradora para consultar información ampliada que incluye la fecha de creación, correo de contacto y el total de usuarios asegurados asociados.

**Why this priority**: Brinda un resumen administrativo integral de la aseguradora sin riesgo de realizar modificaciones accidentales.

**Independent Test**:
- Presionar el botón o acción "Ver" en una fila de la tabla o tarjeta de la aseguradora.
- Verificar que emerge un Drawer de solo lectura con campos inalterables que muestran la fecha de creación y el número total de usuarios asegurados.
- Presionar el botón "Editar" contenido en esta misma vista de solo lectura y confirmar que el formulario pasa a modo editable.

**Acceptance Scenarios**:
1. **Given** la vista de detalle de solo lectura abierta, **When** el administrador hace clic en el botón "Editar", **Then** los campos de texto se habilitan inmediatamente para la edición de datos.

---

### User Story 4 - Deactivate and Reactivate Insurers (Priority: P4)

Como Administrador, quiero poder desactivar lógicamente una aseguradora para suspender temporalmente sus operaciones, con la opción de reactivarla si vuelve a estar vigente.

**Why this priority**: Evita la eliminación física de registros que poseen dependencias históricas (usuarios, convenios), permitiendo un bloqueo reversible.

**Independent Test**:
- Seleccionar "Desactivar" en la lista de aseguradoras activas.
- Confirmar el diálogo emergente de advertencia y validar que la aseguradora pasa a estado "Inactivo" (badge gris).
- Filtrar la lista por inactivos, acceder a las acciones y seleccionar "Activar" para reestablecer el estado activo.

**Acceptance Scenarios**:
1. **Given** una aseguradora en estado activo, **When** el administrador hace clic en la acción "Desactivar", **Then** el sistema presenta un diálogo de confirmación ("¿Estás seguro de que deseas desactivar a [Nombre]?"). Si la aseguradora cuenta con usuarios asociados (`insuredUsersCount > 0`), el diálogo debe incluir una advertencia específica indicando el número de usuarios afectados que quedarán huérfanos. Al confirmar, cambia su estado a inactivo en el sistema sin borrar físicamente el registro.
2. **Given** una aseguradora inactiva, **When** el administrador presiona el botón "Activar" en la tabla filtrada o detalle, **Then** el registro vuelve a estado activo y está disponible de inmediato.

---

### Edge Cases

- **Correo electrónico Duplicado**: Si se intenta crear o editar una aseguradora con un email que ya existe en otra aseguradora del sistema, la API retornará un conflicto (409) y el formulario debe mostrar una advertencia clara: "El correo electrónico ya está registrado por otra aseguradora".
- **Reactivación Directa**: Si una aseguradora inactiva tiene usuarios asegurados huérfanos, su reactivación debe reestablecer las relaciones RBAC o flujos correspondientes de forma inmediata.
- **Formato de Teléfono**: El campo de teléfono es obligatorio y debe contener únicamente dígitos numéricos, opcionalmente precedidos por el prefijo '+' al inicio, con una longitud máxima de 30 caracteres.
- **Carga Binaria de Imagen (Logo)**: Tanto en el registro (`POST`) como en la actualización (`PUT`), las nuevas imágenes de logotipo se deben cargar como archivos binarios (`photo` / `File`) utilizando `FormData`. No se debe enviar la representación base64 local en la propiedad `logoUrl` del JSON/formulario al backend, evitando que los bytes base64 se almacenen directamente en la base de datos en lugar de la ruta relativa del archivo.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST listar todas las aseguradoras registradas, mostrando su avatar (iniciales como fallback), nombre, dirección, teléfono, contacto y badge de estado.
- **FR-002**: El sistema MUST proveer una barra de búsqueda que filtre coincidencias en tiempo real por el nombre de la aseguradora o su contacto.
- **FR-003**: El filtro por estado MUST permitir discriminar registros por: "Todos", "Activos" e "Inactivos".
- **FR-004**: Los filtros aplicados (búsqueda y estado) MUST ser acumulativos (operación lógica AND).
- **FR-005**: El sistema MUST soportar dos modos de visualización simultáneos y conmutables (Tabla y Tarjetas), persistiendo la preferencia en la sesión mediante `sessionStorage` (`insurersLayoutSelection`).
- **FR-006**: En la vista de Tabla, las columnas de "Nombre", "Dirección" y "Contacto" MUST permitir ordenación ascendente y descendente.
- **FR-007**: Las acciones de creación, edición y visualización de aseguradoras MUST realizarse a través de un panel lateral deslizante (Drawer) alineado a la derecha, para garantizar la consistencia visual de la plataforma.
- **FR-008**: Al crear una aseguradora, los campos de Nombre, Dirección, Teléfono y Email son obligatorios.
- **FR-009**: Al desactivar una aseguradora, se MUST presentar un diálogo de confirmación visual antes de cambiar su estado a Inactivo (badge gris), que muestre una advertencia explícita si la aseguradora tiene usuarios asociados (`insuredUsersCount > 0`).
- **FR-010**: El sistema MUST permitir la reactivación de una aseguradora inactivada desde sus opciones de detalle o listado.

### Key Entities

- **Insurer (Aseguradora)**: Representa una entidad de salud o seguro vinculada a la plataforma.
  - Atributos clave:
    - `id` (guid, identificador único autogenerado UUID v7)
    - `name` (cadena, nombre de la aseguradora, requerido, único, máx 200 caracteres)
    - `address` (cadena, dirección física, requerido, máx 500 caracteres)
    - `phone` (cadena, teléfono de contacto, requerido, máx 30 caracteres)
    - `email` (cadena, correo único en el sistema, requerido, formato válido, máx 200)
    - `personInCharge` (cadena, contacto/persona encargada, opcional)
    - `logoUrl` (cadena, URL del logo de la aseguradora, opcional)
    - `isActive` (booleano, bandera de estado lógico activo/inactivo)
    - `createdAt` (fecha y hora de creación)
    - `updatedAt` (fecha y hora de última actualización)
    - `insuredUsersCount` (numérico, total de usuarios asociados a esta aseguradora)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador puede alternar la vista (Tabla / Tarjetas) en menos de 100 milisegundos.
- **SC-002**: La barra de búsqueda interactiva y los filtros de estado actualizan el listado en pantalla en menos de 150 milisegundos desde que cesa la escritura.
- **SC-003**: El Drawer de creación y edición de aseguradoras valida los campos obligatorios en línea en tiempo real (feedback visual < 100 milisegundos).
- **SC-004**: Los intentos de guardar registros con correo duplicado son interceptados y notificados al usuario en pantalla en menos de 1.5 segundos.

---

## Assumptions

- **A-001**: Las aseguradoras se gestionan a nivel del sistema y sus endpoints correspondientes son públicos o requieren autorización de administrador según el archivo `InsurersEndpoints.md`.
- **A-002**: El conteo de usuarios asegurados asociados a cada aseguradora es calculado dinámicamente por la API o devuelto en el modelo de datos detallado, evitando la carga masiva de usuarios en el cliente.
- **A-003**: El componente de confirmación (`ConfirmDialog`) y los componentes de formulario genéricos (`FormInput`) se reutilizarán para mantener la coherencia del diseño empresarial.
