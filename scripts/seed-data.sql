-- Insertar datos iniciales para el Liceo Cristiano Zacapaneco

-- Insertar niveles educativos
INSERT INTO educational_levels (name, description) VALUES
('Preescolar', 'Educación inicial para niños de 3 a 5 años'),
('Primaria', 'Educación primaria de 1° a 6° grado'),
('Básico', 'Educación básica de 1° a 3° básico'),
('Diversificado', 'Educación diversificada de 4° a 5° diversificado')
ON CONFLICT (name) DO NOTHING;

-- Insertar grados
INSERT INTO grades (level_id, name, description) VALUES
(1, 'Preescolar', 'Nivel preescolar'),
(2, '1° Primaria', 'Primer grado de primaria'),
(2, '2° Primaria', 'Segundo grado de primaria'),
(2, '3° Primaria', 'Tercer grado de primaria'),
(2, '4° Primaria', 'Cuarto grado de primaria'),
(2, '5° Primaria', 'Quinto grado de primaria'),
(2, '6° Primaria', 'Sexto grado de primaria'),
(3, '1° Básico', 'Primer año básico'),
(3, '2° Básico', 'Segundo año básico'),
(3, '3° Básico', 'Tercer año básico'),
(4, '4° Diversificado', 'Cuarto año diversificado'),
(4, '5° Diversificado', 'Quinto año diversificado');

-- Insertar materias
INSERT INTO subjects (name, description) VALUES
('Matemáticas', 'Matemáticas y cálculo'),
('Español', 'Lengua y literatura española'),
('Ciencias Naturales', 'Biología, química y física básica'),
('Estudios Sociales', 'Historia, geografía y civismo'),
('Inglés', 'Idioma inglés'),
('Educación Física', 'Deportes y actividad física'),
('Arte', 'Educación artística y manualidades'),
('Música', 'Educación musical'),
('Religión', 'Educación cristiana'),
('Física', 'Física avanzada'),
('Química', 'Química avanzada'),
('Biología', 'Biología avanzada'),
('Literatura', 'Literatura y análisis de textos'),
('Filosofía', 'Filosofía y ética'),
('Contabilidad', 'Contabilidad y finanzas');

-- Insertar docentes de ejemplo
INSERT INTO teachers (first_name, last_name, email, password_hash, phone) VALUES
('Juan', 'Pérez', 'juan.perez@liceozacapaneco.edu', '$2b$10$example_hash_1', '5551-1234'),
('María', 'González', 'maria.gonzalez@liceozacapaneco.edu', '$2b$10$example_hash_2', '5551-2345'),
('Carlos', 'Rodríguez', 'carlos.rodriguez@liceozacapaneco.edu', '$2b$10$example_hash_3', '5551-3456'),
('Ana', 'López', 'ana.lopez@liceozacapaneco.edu', '$2b$10$example_hash_4', '5551-4567'),
('José', 'Martínez', 'jose.martinez@liceozacapaneco.edu', '$2b$10$example_hash_5', '5551-5678');

-- Insertar estudiantes de ejemplo
INSERT INTO students (student_code, first_name, last_name, date_of_birth, grade_id, parent_name, parent_phone, parent_email) VALUES
('2024001', 'Ana María', 'García', '2015-03-15', 2, 'Roberto García', '5552-1111', 'roberto.garcia@email.com'),
('2024002', 'Carlos', 'Rodríguez', '2015-07-22', 2, 'Carmen Rodríguez', '5552-2222', 'carmen.rodriguez@email.com'),
('2024003', 'María José', 'López', '2014-11-08', 3, 'Luis López', '5552-3333', 'luis.lopez@email.com'),
('2024004', 'José Antonio', 'Pérez', '2014-01-30', 3, 'Sandra Pérez', '5552-4444', 'sandra.perez@email.com'),
('2024005', 'Sofía', 'Hernández', '2010-05-12', 8, 'Miguel Hernández', '5552-5555', 'miguel.hernandez@email.com'),
('2024006', 'Diego', 'Morales', '2010-09-18', 8, 'Patricia Morales', '5552-6666', 'patricia.morales@email.com'),
('2024007', 'Isabella', 'Castro', '2007-12-03', 11, 'Fernando Castro', '5552-7777', 'fernando.castro@email.com'),
('2024008', 'Alejandro', 'Vargas', '2007-04-25', 11, 'Mónica Vargas', '5552-8888', 'monica.vargas@email.com');

-- Insertar clases (asignaciones docente-grado-materia)
INSERT INTO classes (teacher_id, grade_id, subject_id, academic_year, semester) VALUES
(1, 2, 1, 2024, 1), -- Juan Pérez - 1° Primaria - Matemáticas
(1, 3, 1, 2024, 1), -- Juan Pérez - 2° Primaria - Matemáticas
(2, 2, 2, 2024, 1), -- María González - 1° Primaria - Español
(2, 3, 2, 2024, 1), -- María González - 2° Primaria - Español
(3, 8, 3, 2024, 1), -- Carlos Rodríguez - 1° Básico - Ciencias Naturales
(3, 8, 10, 2024, 1), -- Carlos Rodríguez - 1° Básico - Física
(4, 11, 13, 2024, 1), -- Ana López - 4° Diversificado - Literatura
(4, 12, 13, 2024, 1), -- Ana López - 5° Diversificado - Literatura
(5, 11, 15, 2024, 1), -- José Martínez - 4° Diversificado - Contabilidad
(5, 12, 15, 2024, 1); -- José Martínez - 5° Diversificado - Contabilidad

-- Insertar notas de ejemplo
INSERT INTO grades_records (student_id, class_id, grade, observations, evaluation_date) VALUES
(1, 1, 85.5, 'Excelente participación en clase', '2024-03-15'),
(2, 1, 92.0, 'Muy dedicado y responsable', '2024-03-15'),
(3, 2, 78.5, 'Necesita refuerzo en operaciones básicas', '2024-03-15'),
(4, 2, 88.0, 'Buen progreso, sigue mejorando', '2024-03-15'),
(1, 3, 90.0, 'Excelente comprensión lectora', '2024-03-20'),
(2, 3, 87.5, 'Buena expresión oral y escrita', '2024-03-20'),
(5, 5, 95.0, 'Sobresaliente en experimentos', '2024-03-10'),
(6, 5, 82.0, 'Constante mejora en conceptos', '2024-03-10'),
(7, 7, 89.5, 'Excelente análisis literario', '2024-03-05'),
(8, 7, 91.0, 'Muy buena interpretación de textos', '2024-03-05');

-- Insertar períodos de evaluación
INSERT INTO evaluation_periods (name, start_date, end_date, academic_year, is_active) VALUES
('Primer Bimestre 2024', '2024-01-15', '2024-03-15', 2024, TRUE),
('Segundo Bimestre 2024', '2024-03-16', '2024-05-15', 2024, FALSE),
('Tercer Bimestre 2024', '2024-05-16', '2024-07-15', 2024, FALSE),
('Cuarto Bimestre 2024', '2024-07-16', '2024-10-15', 2024, FALSE);
