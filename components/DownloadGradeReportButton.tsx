// components/DownloadGradeReportButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import GradeReportPdfFinal from './GradeReportPdfFinal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { habitGradeService } from '@/lib/services/habitGradeService';
import gradeService from '@/lib/services/gradeService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface HabitGrade {
  id: string;
  nombre: string;
  u1: string | null;
  u2: string | null;
  u3: string | null;
  u4: string | null;
  comentario: string | null;
}

interface ExtracurricularGrade {
  id: string;
  nombre: string;
  u1: string | null;
  u2: string | null;
  u3: string | null;
  u4: string | null;
  comentario: string | null;
}

interface HabitGradeResponse {
  habito_casa: Array<{
    id: string;
    nombre: string;
    u1: string | null;
    u2: string | null;
    u3: string | null;
    u4: string | null;
    comentario: string | null;
  }>;
  responsabilidad_aprendizaje: Array<{
    id: string;
    nombre: string;
    u1: string | null;
    u2: string | null;
    u3: string | null;
    u4: string | null;
    comentario: string | null;
  }>;
  comportamiento: Array<{
    id: string;
    nombre: string;
    u1: string | null;
    u2: string | null;
    u3: string | null;
    u4: string | null;
    comentario: string | null;
  }>;
  extracurriculares?: ExtracurricularGrade[]; // Make this optional
}

interface DownloadGradeReportButtonProps {
  estudiante: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    grado: string;
    seccion: string;
    anio: string;
  };
  periodo: {
    id: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  };
}

export function DownloadGradeReportButton({ estudiante, periodo }: DownloadGradeReportButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [pdfData, setPdfData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Obtener TODAS las calificaciones académicas del estudiante (sin filtrar por período)
        const grades = await gradeService.getByStudent(
          estudiante.id,
          undefined // No filtrar por período para obtener todas las calificaciones
        );

        console.log('🔍 PDF - Calificaciones recibidas:', grades);
        console.log('🔍 PDF - Total de calificaciones:', grades.length);
        console.log('🔍 PDF - Estructura de primera calificación:', grades[0]);

        // 2. Inicializar estructura de hábitos con valores por defecto
        let habitData: {
          habitos_casa: HabitGrade[];
          responsabilidad_aprendizaje: HabitGrade[];
          responsabilidad_comportamiento: HabitGrade[];
          extracurriculares_valorativas: ExtracurricularGrade[];
        } = {
          habitos_casa: [],
          responsabilidad_aprendizaje: [],
          responsabilidad_comportamiento: [],
          extracurriculares_valorativas: []
        };

        try {
          const habitGrades = await gradeService.getHabitGrades(estudiante.id, periodo.id);
          
          console.log('🔍 PDF - HabitGrades recibidas:', habitGrades);
          console.log('🔍 PDF - Tipos encontrados:', [...new Set(habitGrades.map((h: any) => h.tipo))]);
          console.log('🔍 PDF - Nombres de todas las evaluaciones:', habitGrades.map((h: any) => h.nombre));
          console.log('🔍 PDF - Buscando extracurriculares con tipo EXTRACURRICULAR:', habitGrades.filter((h: any) => h.tipo === 'EXTRACURRICULAR'));

          // Los datos ya vienen categorizados por el campo 'tipo' del backend
          // Solo necesitamos pasarlos directamente al PDF
          habitData = {
            habitos_casa: habitGrades.filter((h: any) => h.tipo === 'CASA'),
            responsabilidad_aprendizaje: habitGrades.filter((h: any) => h.tipo === 'APRENDIZAJE'),
            responsabilidad_comportamiento: habitGrades.filter((h: any) => h.tipo === 'COMPORTAMIENTO'),
            extracurriculares_valorativas: habitGrades.filter((h: any) => h.tipo === 'EXTRACURRICULAR')
          };
          
          console.log('🔍 PDF - Extracurriculares filtradas:', habitData.extracurriculares_valorativas);
        } catch (habitError) {
          console.warn('No se pudieron cargar las evaluaciones de hábitos, continuando sin ellas:', habitError);
        }

        // 3. Calcular promedios
        const calculateAverage = (unit: string) => {
          const validGrades = grades
            .filter((g: any) => g[unit] !== undefined && g[unit] !== null)
            .map((g: any) => Number(g[unit]));
          
          if (validGrades.length === 0) return 0;
          return validGrades.reduce((a: number, b: number) => a + b, 0) / validGrades.length;
        };

        const promedios = {
          u1: calculateAverage('u1'),
          u2: calculateAverage('u2'),
          u3: calculateAverage('u3'),
          u4: calculateAverage('u4')
        };

        // 4. Agrupar calificaciones por materia para evitar duplicación
        const materiasMap = new Map<string, any>();
        
        for (const grade of grades as any[]) {
          const materia = grade.materia || {};
          const materiaId = materia.id || 'unknown';
          
          // 🔥 CORRECCIÓN: La calificación viene directamente como número
          const calificacionValor = grade.calificacion || 0;
          const unidad = grade.unidad || 'u1'; // Obtener la unidad de la calificación
          
          console.log('🔍 Procesando materia:', materia.nombre, 'tipoMateria:', materia.tipoMateria, 'con calificación:', calificacionValor, 'en unidad:', unidad);
          
          // Si la materia no existe en el mapa, crearla
          if (!materiasMap.has(materiaId)) {
            const materiaData = {
              id: materiaId,
              nombre: materia.nombre || 'Materia sin nombre',
              tipoMateria: materia.tipoMateria || 'Sin tipo',
              tipoMateriaId: materia.tipoMateriaId,
              // Inicializar todas las unidades en 0
              u1: 0,
              u2: 0,
              u3: 0,
              u4: 0,
              final: 0
            };
            materiasMap.set(materiaId, materiaData);
          }
          
          // Obtener la materia existente y actualizar la unidad correspondiente
          const materiaExistente = materiasMap.get(materiaId);
          
          // Asignar la calificación a la unidad correspondiente
          if (unidad === 'u1') {
            materiaExistente.u1 = calificacionValor;
          } else if (unidad === 'u2') {
            materiaExistente.u2 = calificacionValor;
          } else if (unidad === 'u3') {
            materiaExistente.u3 = calificacionValor;
          } else if (unidad === 'u4') {
            materiaExistente.u4 = calificacionValor;
          }
          
          // Calcular promedio final de las 4 unidades
          const unidades = [materiaExistente.u1, materiaExistente.u2, materiaExistente.u3, materiaExistente.u4];
          const unidadesValidas = unidades.filter(u => u > 0); // Solo unidades con calificación > 0
          
          if (unidadesValidas.length > 0) {
            const promedio = unidadesValidas.reduce((sum, u) => sum + u, 0) / unidadesValidas.length;
            materiaExistente.final = Math.round(promedio); // Redondear a número entero
          } else {
            materiaExistente.final = 0;
          }
        }
        
        // Convertir el mapa a arrays separando materias regulares de extracurriculares
        const materiasRegulares: Array<{
          id: string;
          nombre_materia: string;
          tipoMateria: string;
          u1: number;
          u2: number;
          u3: number;
          u4: number;
          final: number;
        }> = [];
        
        const extracurriculares: Array<{
          id: string;
          nombre: string;
          u1: number | null;
          u2: number | null;
          u3: number | null;
          u4: number | null;
          comentario: string | null;
        }> = [];
        
        // ID que identifica materias extracurriculares
        const EXTRACURRICULAR_TIPO_ID = 'f0e451cc-c9ee-4a3e-a982-d8345c18d108';
        
        // Procesar las materias agrupadas
        for (const materiaData of materiasMap.values()) {
          // Verificar si es extracurricular por tipoMateria (nombre) o tipoMateriaId
          const isExtracurricular = materiaData.tipoMateria === 'EXTRACURRICULAR' || 
                                   materiaData.tipoMateriaId === EXTRACURRICULAR_TIPO_ID;
          
          if (isExtracurricular) {
            extracurriculares.push({
              id: materiaData.id,
              nombre: materiaData.nombre,
              u1: typeof materiaData.u1 === 'number' && materiaData.u1 > 0 ? materiaData.u1 : null,
              u2: typeof materiaData.u2 === 'number' && materiaData.u2 > 0 ? materiaData.u2 : null,
              u3: typeof materiaData.u3 === 'number' && materiaData.u3 > 0 ? materiaData.u3 : null,
              u4: typeof materiaData.u4 === 'number' && materiaData.u4 > 0 ? materiaData.u4 : null,
              comentario: null
            });
          } else {
            // Es una materia regular
            materiasRegulares.push({
              id: materiaData.id,
              nombre_materia: materiaData.nombre,
              tipoMateria: materiaData.tipoMateria,
              u1: typeof materiaData.u1 === 'number' ? materiaData.u1 : 0,
              u2: typeof materiaData.u2 === 'number' ? materiaData.u2 : 0,
              u3: typeof materiaData.u3 === 'number' ? materiaData.u3 : 0,
              u4: typeof materiaData.u4 === 'number' ? materiaData.u4 : 0,
              final: materiaData.final
            });
          }
        }

        // 5. Crear estructura final de datos para el PDF
        const transformedData = {
          estudiante: {
            ...estudiante,
            seccion: estudiante.seccion || 'A'
          },
          materias: materiasRegulares,
          habitos: habitData, // Usar habitData que ya contiene las extracurriculares del backend
          promedios,
          periodo
        };
        
        // Debug logs para extracurriculares
        console.log('🔍 PDF - Materias procesadas:', materiasMap.size);
        console.log('🔍 PDF - Extracurriculares encontradas:', extracurriculares.length);
        console.log('🔍 PDF - Extracurriculares:', extracurriculares);
        console.log('🔍 PDF - HabitData.extracurriculares_valorativas:', habitData.extracurriculares_valorativas);
        console.log('🔍 PDF - TransformedData.habitos.extracurriculares_valorativas:', transformedData.habitos.extracurriculares_valorativas);
        
        setPdfData(transformedData);
      } catch (error) {
        console.error('Error al cargar datos para el PDF:', error);
        setError('Error al cargar los datos del reporte. Por favor, intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [estudiante, periodo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Cargando datos del reporte...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p className="font-medium">Error</p>
        <p>{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
        No hay datos disponibles para generar el reporte
      </div>
    );
  }

  const fileName = `reporte-${estudiante.nombre}-${estudiante.apellido}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>Vista Previa PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa del Reporte de Calificaciones</DialogTitle>
          <DialogDescription>
            Vista previa del reporte de calificaciones del estudiante con opción de descargar en formato PDF
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%" className="border rounded-md">
            <GradeReportPdfFinal data={pdfData} />
          </PDFViewer>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" asChild>
            <PDFDownloadLink
              document={<GradeReportPdfFinal data={pdfData} />}
              fileName={fileName}
              className="flex items-center gap-2"
            >
              {({ loading }) => (
                <>
                  <Download className="h-4 w-4" />
                  {loading ? 'Generando...' : 'Descargar PDF'}
                </>
              )}
            </PDFDownloadLink>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadGradeReportButton;