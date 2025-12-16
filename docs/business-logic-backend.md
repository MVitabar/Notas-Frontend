# Lógica de Negocio Backend: Docentes, Admins, Materias y Estudiantes

## 1. Modelos de Datos

### Usuario (Docente/Admin)
```typescript
interface User {
  id: string;
  role: "teacher" | "admin";
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
```

### Estudiante
```typescript
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  address?: string;
  grade: string;
  studentCode: string;
  status: "active" | "inactive" | "graduated" | "transferred";
  enrollmentDate: string;
  createdAt: string;
  updatedAt: string;
}
```

### Materia/Clase
```typescript
interface Class {
  id: string;
  teacherId: string; // ID del docente a cargo
  grade: string;
  subject: string;
  academicYear: string;
  schedule: string;
  classroom?: string;
  maxStudents: number;
  description?: string;
  studentIds: string[]; // IDs de estudiantes inscritos
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
```

## 2. Endpoints Backend

### Docentes
- `POST /api/teachers` — Crear docente (admin)
- `GET /api/teachers` — Listar docentes (admin)
- `GET /api/teachers/:id` — Ver perfil docente (admin/self)
- `PUT /api/teachers/:id` — Editar docente (admin/self)
- `DELETE /api/teachers/:id` — Eliminar docente (admin)

### Estudiantes
- `POST /api/students` — Crear estudiante (admin)
- `GET /api/students` — Listar estudiantes (admin/docente)
- `GET /api/students/:id` — Ver perfil estudiante (admin/docente)
- `PUT /api/students/:id` — Editar estudiante (admin)
- `DELETE /api/students/:id` — Eliminar estudiante (admin)

### Materias/Clases
- `POST /api/classes` — Crear clase/materia (admin, asigna docente)
- `GET /api/classes` — Listar clases (admin/docente)
- `GET /api/classes/:id` — Ver clase (admin/docente)
- `PUT /api/classes/:id` — Editar clase (admin)
- `DELETE /api/classes/:id` — Eliminar clase (admin)
- `POST /api/classes/:id/enroll` — Inscribir estudiante en clase (admin)

### Relación y lógica de asignación
- Al crear una clase, solo se pueden asignar docentes que tengan la materia y grado seleccionados en su perfil.
- Un docente puede ver solo las clases/materias asignadas y los estudiantes inscritos en ellas.
- Un admin puede ver, crear, editar y eliminar docentes, estudiantes y clases, así como asignar docentes a clases y estudiantes a clases.

## 3. Resumen de Flujos

- **Admin**:
  - Registra docentes con perfil extendido y materias/grados que puede impartir.
  - Inscribe estudiantes con perfil completo y asigna grado.
  - Crea clases/materias, asignando docente y configurando detalles.
  - Asigna estudiantes a clases.
- **Docente**:
  - Ve solo sus clases/materias asignadas.
  - Ve y gestiona estudiantes inscritos en sus clases.
  - (Opcional) Gestiona calificaciones de sus estudiantes.

## 4. Consideraciones de Seguridad
- Validar roles en cada endpoint.
- Solo admin puede crear/editar/eliminar docentes, estudiantes y clases.
- Docentes solo pueden acceder a sus propias clases y estudiantes.
