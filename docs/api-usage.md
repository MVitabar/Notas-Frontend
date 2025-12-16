# API de Sistema de Notas — Documentación de Uso

## Autenticación

- **Registro de usuario (admin)**
  - `POST /api/auth/register`
  - Body: `{ nombre, email, password, rol }`
  - Respuesta: `{ user }`

- **Login**
  - `POST /api/auth/login`
  - Body: `{ email, password }`
  - Respuesta: `{ token, user }`

## Docentes

- **Crear docente**
  - `POST /api/teachers`
  - Body: `{ firstName, lastName, email, ... }`
  - Respuesta: `{ docente, tempPassword }`

- **Listar docentes**
  - `GET /api/teachers`
  - Respuesta: `{ docentes: [...] }`

- **Ver docente**
  - `GET /api/teachers/{id}`
  - Respuesta: `{ docente }`

- **Editar docente**
  - `PUT /api/teachers/{id}`
  - Body: campos a actualizar
  - Respuesta: `{ docente }`

- **Eliminar docente**
  - `DELETE /api/teachers/{id}`
  - Respuesta: `{ message }`

## Estudiantes

- **Crear estudiante**
  - `POST /api/students`
  - Body: `{ firstName, lastName, grade, ... }`
  - Respuesta: `{ student }`

- **Listar estudiantes**
  - `GET /api/students`
  - Respuesta: `{ students: [...] }`

- **Ver estudiante**
  - `GET /api/students/{id}`
  - Respuesta: `{ student }`

- **Editar estudiante**
  - `PUT /api/students/{id}`
  - Body: campos a actualizar
  - Respuesta: `{ student }`

- **Eliminar estudiante**
  - `DELETE /api/students/{id}`
  - Respuesta: `{ message }`

## Clases/Materias

- **Crear clase**
  - `POST /api/classes`
  - Body: `{ teacher, grade, subject, ... }`
  - Respuesta: `{ class }`

- **Listar clases**
  - `GET /api/classes`
  - Respuesta: `{ classes: [...] }`

- **Ver clase**
  - `GET /api/classes/{id}`
  - Respuesta: `{ class }`

- **Editar clase**
  - `PUT /api/classes/{id}`
  - Body: campos a actualizar
  - Respuesta: `{ class }`

- **Eliminar clase**
  - `DELETE /api/classes/{id}`
  - Respuesta: `{ message }`

- **Inscribir estudiante en clase**
  - `POST /api/classes/{id}/enroll`
  - Body: `{ studentId }`
  - Respuesta: `{ message }`

## Notas

- Todas las rutas requieren autenticación JWT (excepto login y register).
- El token JWT debe enviarse en el header `Authorization: Bearer <token>`.
- Los endpoints están protegidos por rol: solo admin puede crear/editar/eliminar docentes, estudiantes y clases; los docentes solo pueden ver sus clases y estudiantes.

## Ejemplo de uso con curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@demo.com","password":"admin123"}'

# Crear docente
curl -X POST http://localhost:3000/api/teachers -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"firstName":"Juan","lastName":"Pérez","email":"juan.perez@demo.com"}'
