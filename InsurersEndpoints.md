# Documentación de Endpoints de Aseguradoras (Slice: Insurers)

Esta documentación detalla de forma exhaustiva únicamente los endpoints de **Gestión de Aseguradoras** (`WithTags("Insurers")`) que pertenecen al Slice Vertical de Aseguradoras (`Insurers`) de la aplicación.

---

## 📌 Tabla de Contenidos

- [Obtener Aseguradora por ID (`GET /api/insurers/{id}`)](#obtener-aseguradora-por-id-get-apiinsurersid)
- [Listar Todas las Aseguradoras (`GET /api/insurers`)](#listar-todas-las-aseguradoras-get-apiinsurers)
- [Listar Aseguradoras Paginadas (`GET /api/insurers/paged`)](#listar-aseguradoras-paginados-get-apiinsurerspaged)
- [Lookup / Búsqueda Rápida de Aseguradoras Activas (`GET /api/insurers/lookup`)](#lookup--búsqueda-rápida-de-aseguradoras-activas-get-apiinsurerslookup)
- [Crear Aseguradora (`POST /api/insurers`)](#crear-aseguradora-post-apiinsurers)
- [Actualizar Aseguradora (`PUT /api/insurers/{id}`)](#actualizar-aseguradora-put-apiinsurersid)
- [Activar o Inactivar Aseguradora (`PATCH /api/insurers/{id}/toggle-status`)](#activar-o-inactivar-aseguradora-patch-apiinsurersidtoggle-status)

---

### Obtener Aseguradora por ID (`GET /api/insurers/{id}`)

*   **Ruta:** `GET /api/insurers/{id}`
*   **Nombre de Acción:** `GetInsurer`
*   **Autorización:** Requerido (`.RequireAuthorization()`)
*   **Parámetros de Ruta:**
    *   `id` (guid, Requerido): ID único de la aseguradora a consultar.

#### Respuesta Exitosa (`200 OK`)
Retorna un objeto `GetInsurerResponse` con la información detallada de la aseguradora:
```json
{
  "id": "018fdf9c-6a7b-7b0b-8d76-5fa42c9431f2",
  "name": "Seguros Salud S.A.",
  "address": "Av. República de Panamá 3055, San Isidro",
  "phone": "+511234567",
  "email": "contacto@segurossalud.com",
  "personInCharge": "Carlos Pérez",
  "logoUrl": "https://storage.segurossalud.com/logo.png",
  "isActive": true,
  "createdAt": "2026-06-03T10:00:00Z",
  "updatedAt": "2026-06-03T10:00:00Z"
}
```

#### Otras Respuestas
*   **`401 Unauthorized`**: El usuario no ha proporcionado credenciales de autenticación válidas.
*   **`404 Not Found`**: No se encuentra una aseguradora con el `id` provisto.

---

### Listar Todas las Aseguradoras (`GET /api/insurers`)

*   **Ruta:** `GET /api/insurers`
*   **Nombre de Acción:** `ListInsurers`
*   **Autorización:** Ninguna (Acceso Público, comentado en el enrutamiento).

#### Respuesta Exitosa (`200 OK`)
Retorna una lista `IEnumerable<ListInsurersResponse>` con todas las aseguradoras registradas en el sistema, ordenadas alfabéticamente por nombre:
```json
[
  {
    "id": "018fdf9c-6a7b-7b0b-8d76-5fa42c9431f2",
    "name": "Aseguradora Alfa",
    "phone": "+511111222",
    "email": "contacto@alfa.com",
    "personInCharge": "Juan Gomez",
    "isActive": true,
    "createdAt": "2026-06-03T10:00:00Z",
    "updatedAt": "2026-06-03T10:00:00Z"
  },
  {
    "id": "018fdf9c-6d2c-7b0b-8d76-6ee29c9431f8",
    "name": "Seguros Salud S.A.",
    "phone": "+511234567",
    "email": "contacto@segurossalud.com",
    "personInCharge": "Carlos Pérez",
    "isActive": true,
    "createdAt": "2026-06-03T10:00:00Z",
    "updatedAt": "2026-06-03T10:00:00Z"
  }
]
```

#### Otras Respuestas
*   **`401 Unauthorized`**: El usuario no ha proporcionado credenciales de autenticación válidas.

---

### Listar Aseguradoras Paginadas (`GET /api/insurers/paged`)

*   **Ruta:** `GET /api/insurers/paged`
*   **Nombre de Acción:** `PagedInsurers`
*   **Autorización:** Ninguna (Acceso Público, comentado en el enrutamiento).
*   **Parámetros de Consulta (Query Params):**
    *   `page` (int, Opcional, por defecto `1`): Número de página. Debe ser mayor o igual a 1.
    *   `pageSize` (int, Opcional, por defecto `10`): Tamaño de la página. Debe estar entre 1 y 100.
    *   `search` (string, Opcional): Filtro de búsqueda que aplica sobre `name` y `email` (búsqueda insensible a mayúsculas/minúsculas mediante `ILIKE`).
    *   `sortBy` (string, Opcional, por defecto `created_at`): Campo de ordenación. Columnas permitidas: `name`, `email`, `isActive`, `created_at`, `updated_at`.
    *   `sortDesc` (bool, Opcional, por defecto `false`): Determina si la ordenación es descendente (`true`) o ascendente (`false`).

#### Respuesta Exitosa (`200 OK`)
Retorna un objeto `PaginatedResult<PagedInsurerItem>` que envuelve la lista y los metadatos de paginación:
```json
{
  "items": [
    {
      "id": "018fdf9c-6a7b-7b0b-8d76-5fa42c9431f2",
      "name": "Seguros Salud S.A.",
      "phone": "+511234567",
      "email": "contacto@segurossalud.com",
      "address": "Av. República de Panamá 3055, San Isidro",
      "logoUrl": "https://storage.segurossalud.com/logo.png",
      "personInCharge": "Carlos Pérez",
      "isActive": true,
      "createdAt": "2026-06-03T10:00:00Z",
      "updatedAt": "2026-06-03T10:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalCount": 1,
  "totalPages": 1,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```

#### Otras Respuestas
*   **`400 Bad Request`**: Parámetros de paginación fuera de rango o inválidos.
*   **`401 Unauthorized`**: El usuario no ha proporcionado credenciales de autenticación válidas.

---

### Lookup / Búsqueda Rápida de Aseguradoras Activas (`GET /api/insurers/lookup`)

*   **Ruta:** `GET /api/insurers/lookup`
*   **Nombre de Acción:** `LookupInsurers`
*   **Autorización:** Ninguna (Acceso Público, utilizado habitualmente por el frontend para poblar dropdowns o combos de selección).

#### Respuesta Exitosa (`200 OK`)
Retorna una lista simplificada `IEnumerable<LookupItemGuid>` que contiene únicamente las aseguradoras **activas** (`is_active = true`), ordenada alfabéticamente:
```json
[
  {
    "id": "018fdf9c-6a7b-7b0b-8d76-5fa42c9431f2",
    "name": "Aseguradora Alfa"
  },
  {
    "id": "018fdf9c-6d2c-7b0b-8d76-6ee29c9431f8",
    "name": "Seguros Salud S.A."
  }
]
```

---

### Crear Aseguradora (`POST /api/insurers`)

*   **Ruta:** `POST /api/insurers`
*   **Nombre de Acción:** `CreateInsurer`
*   **Autorización:** Ninguna (Acceso Público, comentado en el enrutamiento).

#### Cuerpo de la Solicitud (Request Body - JSON)
```json
{
  "name": "Seguros Salud S.A.",
  "address": "Av. República de Panamá 3055, San Isidro",
  "phone": "+511234567",
  "email": "contacto@segurossalud.com",
  "personInCharge": "Carlos Pérez",
  "logoUrl": "https://storage.segurossalud.com/logo.png"
}
```
*   **Validaciones:**
    *   `name`: Requerido, no vacío, longitud máxima de 200 caracteres.
    *   `address`: Requerido, no vacío, longitud máxima de 500 caracteres.
    *   `phone`: Requerido, no vacío, longitud máxima de 30 caracteres.
    *   `email`: Requerido, no vacío, formato de correo válido, longitud máxima de 200 caracteres.
    *   `personInCharge`: Opcional.
    *   `logoUrl`: Opcional.

#### Respuesta Exitosa (`201 Created`)
Retorna la aseguradora creada con su ID autogenerado (UUID v7) y la cabecera `Location` correspondiente:
```json
{
  "id": "018fdf9c-6a7b-7b0b-8d76-5fa42c9431f2",
  "name": "Seguros Salud S.A.",
  "address": "Av. República de Panamá 3055, San Isidro",
  "phone": "+511234567",
  "email": "contacto@segurossalud.com",
  "personInCharge": "Carlos Pérez",
  "logoUrl": "https://storage.segurossalud.com/logo.png",
  "isActive": true,
  "createdAt": "2026-06-03T10:00:00Z",
  "updatedAt": "2026-06-03T10:00:00Z"
}
```

#### Otras Respuestas
*   **`400 Bad Request`**: Datos inválidos en el cuerpo (error de validación FluentValidation).
*   **`401 Unauthorized`**: El usuario no ha proporcionado credenciales de autenticación válidas.

---

### Actualizar Aseguradora (`PUT /api/insurers/{id}`)

*   **Ruta:** `PUT /api/insurers/{id}`
*   **Nombre de Acción:** `UpdateInsurer`
*   **Autorización:** Ninguna (Acceso Público, comentado en el enrutamiento).
*   **Parámetros de Ruta:**
    *   `id` (guid, Requerido): ID único de la aseguradora a actualizar.

#### Cuerpo de la Solicitud (Request Body - JSON)
```json
{
  "name": "Seguros Salud S.A. - Sucursal Norte",
  "address": "Av. Alfredo Mendiola 3400, Los Olivos",
  "phone": "+5117654321",
  "email": "norte@segurossalud.com",
  "personInCharge": "Carlos Pérez Modificado",
  "logoUrl": "https://storage.segurossalud.com/logo_norte.png",
  "isActive": true
}
```
*   **Validaciones:**
    *   `name`: Requerido, no vacío, longitud máxima de 200 caracteres.
    *   `address`: Requerido, no vacío, longitud máxima de 500 caracteres.
    *   `phone`: Requerido, no vacío, longitud máxima de 30 caracteres.
    *   `email`: Requerido, no vacío, formato de correo válido, longitud máxima de 200 caracteres.
    *   `isActive`: Requerido.

#### Respuesta Exitosa (`200 OK`)
Retorna la aseguradora actualizada con los nuevos valores:
```json
{
  "id": "018fdf9c-6a7b-7b0b-8d76-5fa42c9431f2",
  "name": "Seguros Salud S.A. - Sucursal Norte",
  "address": "Av. Alfredo Mendiola 3400, Los Olivos",
  "phone": "+5117654321",
  "email": "norte@segurossalud.com",
  "personInCharge": "Carlos Pérez Modificado",
  "logoUrl": "https://storage.segurossalud.com/logo_norte.png",
  "isActive": true,
  "createdAt": "2026-06-03T10:00:00Z",
  "updatedAt": "2026-06-03T10:30:00Z"
}
```

#### Otras Respuestas
*   **`400 Bad Request`**: Datos inválidos en el cuerpo (error de validación FluentValidation).
*   **`401 Unauthorized`**: El usuario no ha proporcionado credenciales de autenticación válidas.
*   **`404 Not Found`**: No se encuentra una aseguradora con el `id` provisto.

---

### Activar o Inactivar Aseguradora (`PATCH /api/insurers/{id}/toggle-status`)

*   **Ruta:** `PATCH /api/insurers/{id}/toggle-status`
*   **Nombre de Acción:** `ToggleInsurerStatus`
*   **Autorización:** Ninguna (Acceso Público, comentado en el enrutamiento).
*   **Parámetros de Ruta:**
    *   `id` (guid, Requerido): ID único de la aseguradora a la que se le alternará el estado.

#### Respuesta Exitosa (`200 OK`)
Retorna un objeto indicando el nuevo estado lógico de la aseguradora:
```json
{
  "id": "018fdf9c-6a7b-7b0b-8d76-5fa42c9431f2",
  "name": "Seguros Salud S.A.",
  "isActive": false,
  "status": "Inactivado"
}
```

#### Otras Respuestas
*   **`401 Unauthorized`**: El usuario no ha proporcionado credenciales de autenticación válidas.
*   **`404 Not Found`**: No se encuentra una aseguradora con el `id` provisto.
