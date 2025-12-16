-- Actualizar base de datos para incluir sistema de bimestres

-- Crear tabla de años académicos
CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de bimestres
CREATE TABLE IF NOT EXISTS bimesters (
    id SERIAL PRIMARY KEY,
    academic_year_id INTEGER REFERENCES academic_years(id),
    bimester_number INTEGER CHECK (bimester_number IN (1, 2, 3, 4)),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(academic_year_id, bimester_number)
);

-- Actualizar tabla de clases para incluir año académico
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id);

-- Actualizar tabla de notas para incluir bimestre
ALTER TABLE grades_records 
ADD COLUMN IF NOT EXISTS bimester_id INTEGER REFERENCES bimesters(id);

-- Crear tabla de promedios por bimestre
CREATE TABLE IF NOT EXISTS bimester_averages (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    bimester_id INTEGER REFERENCES bimesters(id),
    average DECIMAL(5,2) CHECK (average >= 0 AND average <= 100),
    total_evaluations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, bimester_id)
);

-- Crear tabla de promedios anuales
CREATE TABLE IF NOT EXISTS annual_averages (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
    annual_average DECIMAL(5,2) CHECK (annual_average >= 0 AND annual_average <= 100),
    bimester1_avg DECIMAL(5,2),
    bimester2_avg DECIMAL(5,2),
    bimester3_avg DECIMAL(5,2),
    bimester4_avg DECIMAL(5,2),
    final_status VARCHAR(20) CHECK (final_status IN ('APROBADO', 'REPROBADO', 'PENDIENTE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, academic_year_id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_bimesters_academic_year ON bimesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_bimesters_active ON bimesters(is_active);
CREATE INDEX IF NOT EXISTS idx_grades_records_bimester ON grades_records(bimester_id);
CREATE INDEX IF NOT EXISTS idx_bimester_averages_student ON bimester_averages(student_id);
CREATE INDEX IF NOT EXISTS idx_bimester_averages_class ON bimester_averages(class_id);
CREATE INDEX IF NOT EXISTS idx_bimester_averages_bimester ON bimester_averages(bimester_id);
CREATE INDEX IF NOT EXISTS idx_annual_averages_student ON annual_averages(student_id);
CREATE INDEX IF NOT EXISTS idx_annual_averages_year ON annual_averages(academic_year_id);

-- Crear función para calcular promedios por bimestre
CREATE OR REPLACE FUNCTION calculate_bimester_average(
    p_student_id INTEGER,
    p_class_id INTEGER,
    p_bimester_id INTEGER
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    avg_grade DECIMAL(5,2);
BEGIN
    SELECT AVG(grade) INTO avg_grade
    FROM grades_records
    WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND bimester_id = p_bimester_id;
    
    RETURN COALESCE(avg_grade, 0);
END;
$$ LANGUAGE plpgsql;

-- Crear función para calcular promedio anual
CREATE OR REPLACE FUNCTION calculate_annual_average(
    p_student_id INTEGER,
    p_class_id INTEGER,
    p_academic_year_id INTEGER
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    avg_grade DECIMAL(5,2);
BEGIN
    SELECT AVG(average) INTO avg_grade
    FROM bimester_averages ba
    JOIN bimesters b ON ba.bimester_id = b.id
    WHERE ba.student_id = p_student_id
    AND ba.class_id = p_class_id
    AND b.academic_year_id = p_academic_year_id;
    
    RETURN COALESCE(avg_grade, 0);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar promedios automáticamente
CREATE OR REPLACE FUNCTION update_averages_trigger() RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar promedio del bimestre
    INSERT INTO bimester_averages (student_id, class_id, bimester_id, average, total_evaluations)
    VALUES (
        NEW.student_id,
        NEW.class_id,
        NEW.bimester_id,
        calculate_bimester_average(NEW.student_id, NEW.class_id, NEW.bimester_id),
        (SELECT COUNT(*) FROM grades_records WHERE student_id = NEW.student_id AND class_id = NEW.class_id AND bimester_id = NEW.bimester_id)
    )
    ON CONFLICT (student_id, class_id, bimester_id)
    DO UPDATE SET
        average = calculate_bimester_average(NEW.student_id, NEW.class_id, NEW.bimester_id),
        total_evaluations = (SELECT COUNT(*) FROM grades_records WHERE student_id = NEW.student_id AND class_id = NEW.class_id AND bimester_id = NEW.bimester_id),
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS grades_update_averages ON grades_records;
CREATE TRIGGER grades_update_averages
    AFTER INSERT OR UPDATE ON grades_records
    FOR EACH ROW
    EXECUTE FUNCTION update_averages_trigger();
