-- Insertar datos iniciales para el sistema de bimestres

-- Insertar años académicos
INSERT INTO academic_years (year, start_date, end_date, is_active) VALUES
(2024, '2024-01-15', '2024-12-15', TRUE),
(2023, '2023-01-15', '2023-12-15', FALSE),
(2025, '2025-01-15', '2025-12-15', FALSE)
ON CONFLICT (year) DO NOTHING;

-- Obtener el ID del año académico 2024
DO $$
DECLARE
    year_2024_id INTEGER;
    year_2023_id INTEGER;
BEGIN
    SELECT id INTO year_2024_id FROM academic_years WHERE year = 2024;
    SELECT id INTO year_2023_id FROM academic_years WHERE year = 2023;
    
    -- Insertar bimestres para 2024
    INSERT INTO bimesters (academic_year_id, bimester_number, name, start_date, end_date, is_active) VALUES
    (year_2024_id, 1, 'Primer Bimestre 2024', '2024-01-15', '2024-03-15', FALSE),
    (year_2024_id, 2, 'Segundo Bimestre 2024', '2024-04-15', '2024-06-15', TRUE),
    (year_2024_id, 3, 'Tercer Bimestre 2024', '2024-07-15', '2024-09-15', FALSE),
    (year_2024_id, 4, 'Cuarto Bimestre 2024', '2024-10-15', '2024-12-15', FALSE)
    ON CONFLICT (academic_year_id, bimester_number) DO NOTHING;
    
    -- Insertar bimestres para 2023 (histórico)
    INSERT INTO bimesters (academic_year_id, bimester_number, name, start_date, end_date, is_active) VALUES
    (year_2023_id, 1, 'Primer Bimestre 2023', '2023-01-15', '2023-03-15', FALSE),
    (year_2023_id, 2, 'Segundo Bimestre 2023', '2023-04-15', '2023-06-15', FALSE),
    (year_2023_id, 3, 'Tercer Bimestre 2023', '2023-07-15', '2023-09-15', FALSE),
    (year_2023_id, 4, 'Cuarto Bimestre 2023', '2023-10-15', '2023-12-15', FALSE)
    ON CONFLICT (academic_year_id, bimester_number) DO NOTHING;
END $$;

-- Actualizar clases existentes con año académico
UPDATE classes 
SET academic_year_id = (SELECT id FROM academic_years WHERE year = 2024)
WHERE academic_year_id IS NULL;

-- Actualizar notas existentes con bimestre
UPDATE grades_records 
SET bimester_id = (
    SELECT id FROM bimesters 
    WHERE academic_year_id = (SELECT id FROM academic_years WHERE year = 2024)
    AND bimester_number = 1
)
WHERE bimester_id IS NULL;

-- Insertar datos de ejemplo para promedios por bimestre
DO $$
DECLARE
    bimester1_id INTEGER;
    bimester2_id INTEGER;
    class1_id INTEGER;
    class2_id INTEGER;
BEGIN
    -- Obtener IDs de bimestres
    SELECT id INTO bimester1_id FROM bimesters WHERE bimester_number = 1 AND academic_year_id = (SELECT id FROM academic_years WHERE year = 2024);
    SELECT id INTO bimester2_id FROM bimesters WHERE bimester_number = 2 AND academic_year_id = (SELECT id FROM academic_years WHERE year = 2024);
    
    -- Obtener IDs de clases
    SELECT id INTO class1_id FROM classes LIMIT 1;
    SELECT id INTO class2_id FROM classes LIMIT 1 OFFSET 1;
    
    -- Insertar promedios de ejemplo para el primer bimestre
    INSERT INTO bimester_averages (student_id, class_id, bimester_id, average, total_evaluations) VALUES
    (1, class1_id, bimester1_id, 85.0, 3),
    (2, class1_id, bimester1_id, 92.0, 3),
    (3, class1_id, bimester1_id, 78.0, 3),
    (4, class1_id, bimester1_id, 88.0, 3),
    (5, class1_id, bimester1_id, 95.0, 3),
    (6, class1_id, bimester1_id, 82.0, 3)
    ON CONFLICT (student_id, class_id, bimester_id) DO NOTHING;
    
    -- Insertar promedios de ejemplo para el segundo bimestre
    INSERT INTO bimester_averages (student_id, class_id, bimester_id, average, total_evaluations) VALUES
    (1, class1_id, bimester2_id, 87.0, 2),
    (2, class1_id, bimester2_id, 89.0, 2),
    (3, class1_id, bimester2_id, 82.0, 2),
    (4, class1_id, bimester2_id, 85.0, 2),
    (5, class1_id, bimester2_id, 93.0, 2),
    (6, class1_id, bimester2_id, 84.0, 2)
    ON CONFLICT (student_id, class_id, bimester_id) DO NOTHING;
    
    -- Insertar promedios anuales de ejemplo
    INSERT INTO annual_averages (student_id, class_id, academic_year_id, annual_average, bimester1_avg, bimester2_avg, final_status) VALUES
    (1, class1_id, (SELECT id FROM academic_years WHERE year = 2024), 86.0, 85.0, 87.0, 'APROBADO'),
    (2, class1_id, (SELECT id FROM academic_years WHERE year = 2024), 90.5, 92.0, 89.0, 'APROBADO'),
    (3, class1_id, (SELECT id FROM academic_years WHERE year = 2024), 80.0, 78.0, 82.0, 'APROBADO'),
    (4, class1_id, (SELECT id FROM academic_years WHERE year = 2024), 86.5, 88.0, 85.0, 'APROBADO'),
    (5, class1_id, (SELECT id FROM academic_years WHERE year = 2024), 94.0, 95.0, 93.0, 'APROBADO'),
    (6, class1_id, (SELECT id FROM academic_years WHERE year = 2024), 83.0, 82.0, 84.0, 'APROBADO')
    ON CONFLICT (student_id, class_id, academic_year_id) DO NOTHING;
END $$;
