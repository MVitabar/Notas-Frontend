# Sistema de Autenticación y Autorización por Roles (Diseño Backend)

## Modelos de Datos

### Usuario (Docente/Admin)
```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: "teacher" | "admin";
  status: "active" | "inactive";
  createdAt: string;
  lastAccessAt?: string;
  phone?: string;
  address?: string;
}
```

### Estudiante
```typescript
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentCode: string;
  classIds: string[]; // IDs de las clases/materias
  status: "active" | "inactive" | "graduated";
  createdAt: string;
  updatedAt: string;
}
```

### Materia/Clase
```typescript
interface Class {
  id: string;
  name: string;
  teacherId: string; // ID del docente a cargo
  subject: string;
  grade: string;
  academicYear: string;
  schedule: string;
  maxStudents: number;
  studentIds: string[]; // IDs de estudiantes inscritos
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
```

## Endpoints necesarios

- `POST /api/auth/register` — Registrar usuario (solo admin)
- `POST /api/auth/login` — Login (devuelve JWT)
- `GET /api/auth/me` — Obtener datos del usuario autenticado
- `POST /api/auth/logout` — Cerrar sesión (opcional, si se maneja refresh token)
- `GET /api/users` — Listar usuarios (solo admin)
- `GET /api/users/:id` — Obtener usuario por ID (admin o self)
- `PUT /api/users/:id` — Editar usuario (admin o self)
- `DELETE /api/users/:id` — Eliminar usuario (solo admin)
- `GET /api/estudiantes` — Listar estudiantes (admin/docente)
- `GET /api/materias` — Listar materias (según rol)
- `POST /api/materias` — Crear materia (solo admin)
- `PUT /api/materias/:id` — Editar materia (solo admin)
- `DELETE /api/materias/:id` — Eliminar materia (solo admin)

## Autenticación y Autorización

- Usar JWT para autenticación (guardado en cookie httpOnly o localStorage).
- Middleware para validar JWT y extraer rol del usuario.
- Middleware para proteger rutas según rol (`admin`, `docente`).

## Siguientes pasos

1. Implementar modelos y endpoints en el backend (Next.js API routes).
2. Crear middleware de autenticación y autorización.
3. Integrar frontend con endpoints de login y validación de roles.
4. Proteger rutas y componentes en el frontend según el rol.
