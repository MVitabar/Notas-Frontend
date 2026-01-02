// components/DownloadGradeReportButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import GradeReportPdf from './GradeReportPdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { habitGradeService } from '@/lib/services/habitGradeService';
import gradeService from '@/lib/services/gradeService';
import {
  Dialog,
  DialogContent,
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

        console.log('Iniciando carga de datos para el PDF...');
        console.log('Estudiante ID:', estudiante.id);
        console.log('Período ID:', periodo.id);

        // 1. Obtener calificaciones académicas
        console.log('Obteniendo calificaciones académicas...');
        const grades = await gradeService.getByStudent(
          estudiante.id,
          periodo.id
        );
        console.log('Calificaciones recibidas:', grades);

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
          console.log('Obteniendo evaluaciones de hábitos del nuevo endpoint...');
          const habitGrades = await gradeService.getHabitGrades(estudiante.id, periodo.id);
          console.log('Evaluaciones de hábitos recibidas:', habitGrades);

          // Los datos ya vienen categorizados por el campo 'tipo' del backend
          // Solo necesitamos pasarlos directamente al PDF
          habitData = {
            habitos_casa: habitGrades.filter((h: any) => h.tipo === 'CASA'),
            responsabilidad_aprendizaje: habitGrades.filter((h: any) => h.tipo === 'APRENDIZAJE'),
            responsabilidad_comportamiento: habitGrades.filter((h: any) => h.tipo === 'COMPORTAMIENTO'),
            extracurriculares_valorativas: habitGrades.filter((h: any) => h.tipo === 'EXTRACURRICULAR')
          };
          
          console.log('Hábitos categorizados:', {
            casa: habitData.habitos_casa.length,
            aprendizaje: habitData.responsabilidad_aprendizaje.length,
            comportamiento: habitData.responsabilidad_comportamiento.length,
            extracurriculares: habitData.extracurriculares_valorativas.length
          });
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

        // 4. Separar materias regulares de extracurriculares
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
        
        // Define the shape of the calificacion object
        interface Calificacion {
          u1?: number | string | null;
          u2?: number | string | null;
          u3?: number | string | null;
          u4?: number | string | null;
          promedio?: number | string | null;
          evaluacion?: {
            u1?: string | null;
            u2?: string | null;
            u3?: string | null;
            u4?: string | null;
          };
        }

        // Define the shape of the grade object
        interface Grade {
          materia: {
            id?: string;
            nombre?: string;
            tipoMateria?: string;
            tipoMateriaId?: string;
          };
          calificacion?: Calificacion;
        }

        for (const grade of grades as Grade[]) {
          const materia = grade.materia || {};
          const calificacion: Calificacion = grade.calificacion || {};
          
          // Helper function to safely convert grade values
          const getGradeValue = (evaluation: string | null | undefined, grade: any): string | number => {
            if (evaluation !== null && evaluation !== undefined) return evaluation;
            const num = Number(grade);
            return isNaN(num) ? 0 : num;
          };
          
          const materiaData = {
            id: materia.id || `materia-${Math.random().toString(36).substr(2, 9)}`,
            nombre: materia.nombre || 'Materia sin nombre',
            tipoMateria: materia.tipoMateria || 'Sin tipo',
            tipoMateriaId: materia.tipoMateriaId,
            u1: getGradeValue(calificacion.evaluacion?.u1, calificacion.u1),
            u2: getGradeValue(calificacion.evaluacion?.u2, calificacion.u2),
            u3: getGradeValue(calificacion.evaluacion?.u3, calificacion.u3),
            u4: getGradeValue(calificacion.evaluacion?.u4, calificacion.u4),
            final: Number(calificacion.promedio) || 0
          };
          
          // Verificar si es extracurricular por tipoMateriaId
          if ((materia as any).tipoMateriaId === EXTRACURRICULAR_TIPO_ID) {
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
          habitos: habitData, // ← Nuevo: datos crudos del endpoint
          promedios,
          periodo
        };
        
        console.log('Materias regulares:', materiasRegulares);
        console.log('Actividades extracurriculares:', extracurriculares);

        console.log('Datos transformados para el PDF:', transformedData);
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

  // Debug: Log the data being passed to the PDF
  console.log('PDF Data:', JSON.stringify(pdfData, null, 2));

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
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%" className="border rounded-md">
            <GradeReportPdf data={pdfData} />
          </PDFViewer>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" asChild>
            <PDFDownloadLink
              document={<GradeReportPdf data={pdfData} />}
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
}

export default DownloadGradeReportButton;