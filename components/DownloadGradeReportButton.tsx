'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import GradeReportPdf from './GradeReportPdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { habitGradeService, type HabitGradeSummary } from '@/lib/services/habitGradeService';
import type { Habito, EvaluacionExtracurricular } from './GradeReportPdf';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  materias: Array<{
    id: string;
    nombre_materia: string;
    u1: string | number;
    u2: string | number;
    u3: string | number;
    u4: string | number;
    final: string | number;
  }>;
  extracurriculares_valorativas: Array<{
    id: string;
    nombre: string;
    u1: string | number;
    u2: string | number;
    u3: string | number;
    u4: string | number;
  }>;
  responsabilidad_aprendizaje: Array<{
    id: string;
    nombre: string;
    u1: string | number;
    u2: string | number;
    u3: string | number;
    u4: string | number;
  }>;
  responsabilidad_comportamiento: Array<{
    id: string;
    nombre: string;
    u1: string | number;
    u2: string | number;
    u3: string | number;
    u4: string | number;
  }>;
  habitos_casa: Array<{
    id: string;
    nombre: string;
    u1: string | number;
    u2: string | number;
    u3: string | number;
    u4: string | number;
  }>;
  promedios: {
    u1: number;
    u2: number;
    u3: number;
    u4: number;
  };
}

export function DownloadGradeReportButton({
  estudiante,
  materias = [],
  extracurriculares_valorativas = [],
  responsabilidad_aprendizaje = [],
  responsabilidad_comportamiento = [],
  habitos_casa = [],
  promedios = { u1: 0, u2: 0, u3: 0, u4: 0 },
  periodo = {
    id: '',
    nombre: 'Período actual',
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date().toISOString()
  },
  calificaciones = [],
  resumen = {
    totalMaterias: 0,
    aprobadas: 0,
    reprobadas: 0,
    promedioGeneral: 0,
    asistencias: {
      total: 0,
      presentes: 0,
      ausentes: 0,
      porcentajeAsistencia: 0
    }
  },
  conducta = {
    valores: [],
    observacionesGenerales: ''
  },
  firmaDocente = {
    nombre: '',
    cargo: 'Docente',
    fecha: new Date().toISOString()
  }
}: DownloadGradeReportButtonProps & {
  periodo?: {
    id: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  };
  calificaciones?: any[];
  resumen?: any;
  conducta?: any;
  firmaDocente?: any;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [habitGrades, setHabitGrades] = useState<{
    habito_casa: Habito[];
    responsabilidad_aprendizaje: Habito[];
    comportamiento: Habito[];
  }>({
    habito_casa: [],
    responsabilidad_aprendizaje: [],
    comportamiento: []
  });
  
  const [extracurriculares, setExtracurriculares] = useState<EvaluacionExtracurricular[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHabitGrades = async () => {
      if (estudiante.id && periodo.id) {
        try {
          const summary = await habitGradeService.getSummary(estudiante.id, periodo.id);
          setHabitGrades(summary);
        } catch (error) {
          console.error('Error al cargar las calificaciones de hábitos:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchHabitGrades();
  }, [estudiante.id, periodo.id]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  const formatHabitGrade = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return value.toString();
  };

  const pdfData = {
    estudiante: {
      ...estudiante,
      anio: estudiante.anio || new Date().getFullYear().toString(),
    },
    periodo,
    materias,
    extracurriculares_valorativas: habitGrades.habito_casa.map(habito => ({
      ...habito,
      u1: formatHabitGrade(habito.u1),
      u2: formatHabitGrade(habito.u2),
      u3: formatHabitGrade(habito.u3),
      u4: formatHabitGrade(habito.u4),
    })),
    responsabilidad_aprendizaje: habitGrades.responsabilidad_aprendizaje.map(habito => ({
      ...habito,
      u1: formatHabitGrade(habito.u1),
      u2: formatHabitGrade(habito.u2),
      u3: formatHabitGrade(habito.u3),
      u4: formatHabitGrade(habito.u4),
    })),
    responsabilidad_comportamiento: habitGrades.comportamiento.map(habito => ({
      ...habito,
      u1: formatHabitGrade(habito.u1),
      u2: formatHabitGrade(habito.u2),
      u3: formatHabitGrade(habito.u3),
      u4: formatHabitGrade(habito.u4),
    })),
    habitos_casa: habitGrades.habito_casa.map(habito => ({
      ...habito,
      u1: formatHabitGrade(habito.u1),
      u2: formatHabitGrade(habito.u2),
      u3: formatHabitGrade(habito.u3),
      u4: formatHabitGrade(habito.u4),
    })),
    promedios,
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </Button>
    );
  }

  const pdfDocument = <GradeReportPdf data={pdfData} />;
  const fileName = `boletin_${estudiante.apellido.toLowerCase()}_${estudiante.nombre.toLowerCase()}.pdf`;

  const renderDownloadButton = ({ loading, error }: { loading: boolean; error: Error | null }) => {
    if (error) {
      console.error('Error generating PDF:', error);
      return (
        <Button variant="ghost" size="sm" disabled>
          <Download className="h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        className="h-8 w-8 p-0"
        title="Descargar boletín"
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    );
  };

  return (
    <div className="flex gap-1">
      {/* Preview Button */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            title="Vista previa del boletín"
            className="h-8 w-8 p-0"
            onClick={() => setIsGenerating(true)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle>Vista previa del boletín</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-2">
            {isGenerating && (
              <PDFViewer className="w-full h-full min-h-[70vh] border rounded">
                {pdfDocument}
              </PDFViewer>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cerrar
            </Button>
            <PDFDownloadLink
              document={pdfDocument}
              fileName={fileName}
              onClick={() => setIsPreviewOpen(false)}
            >
              {({ loading, error }) => (
                <Button disabled={loading}>
                  {loading ? 'Generando...' : 'Descargar PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Download Button */}
      <PDFDownloadLink document={pdfDocument} fileName={fileName}>
        {renderDownloadButton}
      </PDFDownloadLink>
    </div>
  );
}

export default DownloadGradeReportButton;
