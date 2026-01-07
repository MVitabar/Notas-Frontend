"use client";

import {
  useState,
  useEffect,
  useMemo,
  MouseEvent as ReactMouseEvent,
  useCallback,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardService } from "@/lib/services/dashboardService";
import type { Estudiante, Materia, MateriaResponse, MateriaAsignada } from "@/lib/services/dashboardService";

// Import academicPeriodService
import { academicPeriodService } from "@/lib/services/academicPeriodService";

// Periodo type is defined once in the interfaces section

// Import gradeService and its types
import gradeService, {
  type CalificacionResponse,
  type CalificacionPorEstudiante,
  type ValorConceptual,
  type CreateCalificacionRequest,
  type UpdateCalificacionRequest,
} from "@/lib/services/gradeService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Check,
  Pencil,
  Edit,
  BookOpen,
  User,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Mail,
  Phone,
  MapPin,
  BookOpenCheck,
  X,
  AlertCircle,
  TrendingUp,
  Home,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  GraduationCap,
  Upload,
  FileText,
  Users,
  Settings,
  Plus,
  Download,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardMateria = Materia;

interface GradeFormData {
  materiaId: string;
  tipoCalificacion: "NUMERICA" | "CONCEPTUAL";
  tipoEvaluacion: string;
  calificacion?: number;
  valorConceptual?: ValorConceptual;
  valorExtraescolar?: string;
  comentario?: string;
  esExtraescolar?: boolean;
  nombreMateria?: string; // Para mostrar el nombre de la materia/actividad
}

// Single Periodo interface definition
interface Periodo {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  isCurrent?: boolean;
  description?: string;
}

interface Docente {
  id: string;
  nombre: string;
}

interface Grade
  extends Omit<
    CalificacionPorEstudiante,
    "periodo" | "materia" | "docente" | "estudiante"
  > {
  estudiante: Estudiante;
  materia: MateriaBase; // Using MateriaBase for consistency
  periodo: Periodo;
  docente: {
    id: string;
    nombre: string;
  };
  fecha: string;
  createdAt: string;
  updatedAt: string;
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import DownloadGradeReportButton from "@/components/DownloadGradeReportButton";
import {
  type GradoConMaterias,
  type Materia as ServiceMateria,
  type MateriaBase,
  type Bimestre,
  type TeacherProfile,
} from "@/lib/services/dashboardService";
import { SaveHabitGradesRequest } from "@/lib/services/gradeService";

// Definir un tipo local para el dashboard
type DashboardAcademicPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: "active" | "completed" | "cancelled" | "upcoming";
  description?: string;
  unidadAsignada?: string; // Unidad asignada al período (u1, u2, u3, u4)
  estado?: string; // For compatibility with existing code
};

// Create a GradoInfo type that extends GradoConMaterias with our Materia type
type GradoInfo = Omit<GradoConMaterias, "materias" | "estudiantes"> & {
  materias: MateriaBase[]; // Use MateriaBase to match GradoConMaterias
  estudiantes: any[];
};

// Types are now imported from the service
type EstadisticasBimestrales = Awaited<
  ReturnType<typeof dashboardService.getEstadisticasBimestrales>
>;

// Add missing state for selectedBimester


// Update the Grade interface
interface Grade extends Omit<CalificacionPorEstudiante, "periodo" | "materia" | "docente" | "estudiante"> {
  estudiante: Estudiante;
  materia: MateriaBase; // Using MateriaBase for consistency
  periodo: Periodo;
  docente: {
    id: string;
    nombre: string;
  };
  fecha: string;
  createdAt: string;
  updatedAt: string;
}

export function Dashboard() {
  // Estado para la pestaña activa (solo grados ahora)
  const [activeMainTab, setActiveMainTab] = useState<"grados">("grados");
  const [selectedBimester, setSelectedBimester] = useState("1");

  // Estado para los grados
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [students, setStudents] = useState<Estudiante[]>([]);
  const [classInfo, setClassInfo] = useState<{
    grado: string;
    nivel: string;
    seccion?: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [errorLoadingStudents, setErrorLoadingStudents] = useState<string | null>(null);

  // Cargar estudiantes cuando se selecciona un grado
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedGrade) {
        setClassInfo(null);
        return;
      }

      setIsLoadingStudents(true);
      setErrorLoadingStudents(null);

      try {
        const [grado, nivel, seccion] = selectedGrade.split("|");

        // Actualizar la información de la clase
        setClassInfo({
          grado,
          nivel,
          seccion: seccion || undefined,
        });

        // Llamar al servicio para obtener estudiantes reales
        console.log('🔍 Dashboard - Loading students for:', { grado, nivel, seccion, selectedGrade });
        
        // Enviar el nombre completo del grado en lugar de formatearlo
        const gradoCompleto = nivel || grado;
        const estudiantes = await dashboardService.getEstudiantesPorGrado({
          grado: parseInt(grado), // Mantener el número para compatibilidad
          nivel: gradoCompleto,
          seccion: seccion || undefined,
        });

        setStudents(estudiantes);
      } catch (error) {
        console.error("Error al cargar estudiantes:", error);
        setErrorLoadingStudents("Error al cargar la lista de estudiantes");
        setStudents([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, [selectedGrade]);



  // Manejar la edición de una calificación
  const handleEditGrade = (studentId: string, currentGrade: number | null, materiaId: string) => {
    // Buscar la calificación existente
    const gradeToEdit = classGrades.find(
      g => g.estudianteId === studentId && 
           g.materiaId === materiaId
    );

    if (gradeToEdit) {
      console.log('Configurando formulario para editar calificación existente:', {
        materiaId: gradeToEdit.materiaId,
        tipoCalificacion: gradeToEdit.tipoCalificacion,
        tipoEvaluacion: gradeToEdit.tipoEvaluacion,
        calificacion: gradeToEdit.calificacion,
        valorConceptual: gradeToEdit.valorConceptual,
        comentario: gradeToEdit.comentario
      });
      // 🔥 CONFIGURAR newGrade con los datos de la calificación existente
      setNewGrade({
        materiaId: gradeToEdit.materiaId,
        tipoCalificacion: gradeToEdit.tipoCalificacion,
        tipoEvaluacion: gradeToEdit.tipoEvaluacion,
        calificacion: gradeToEdit.calificacion || undefined,
        valorConceptual: gradeToEdit.valorConceptual || undefined,
        comentario: gradeToEdit.comentario || ''
      });
      setEditingId(studentId);
    } else {
      setNewGrade(prev => {
        const newState = {
          ...prev,
          materiaId,
          calificacion: currentGrade || undefined,
        };
        return newState;
      });
      setEditingId(studentId);
    }
  };

  // Guardar la calificación editada del estudiante
  const handleSaveStudentGrade = async (studentId: string) => {
    try {
      // Validar el valor
      const gradeValue = parseFloat(editValue);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
        alert('La calificación debe ser un número entre 0 y 100');
        return;
      }

      // Encontrar la calificación existente para este estudiante
      const existingGrade = classGrades.find(g => g.estudianteId === studentId);
      
      if (!existingGrade) {
        alert('No se encontró una calificación existente para este estudiante');
        return;
      }

      // 🔥 USAR EL SISTEMA REAL DE GUARDADO
      // Preparar los datos para actualizar usando el mismo formato que handleSaveGrade
      const gradeData = {
        calificacion: gradeValue,
        comentario: existingGrade.comentario || '',
        tipoCalificacion: existingGrade.tipoCalificacion || 'NUMERICA',
        ...(existingGrade.valorConceptual && { valorConceptual: existingGrade.valorConceptual }),
        ...(existingGrade.nombreMateria && { nombreMateria: existingGrade.nombreMateria })
      };

      // Actualizar la calificación usando el gradeService
      const updatedGrade = await gradeService.update(existingGrade.id, gradeData);
      
      // Actualizar el estado local
      setClassGrades(prevGrades => 
        prevGrades.map(g => 
          g.id === existingGrade.id 
            ? { ...g, calificacion: gradeValue }
            : g
        )
      );

      // Actualizar la interfaz
      setEditingId(null);
      setEditValue(''); // Limpiar el valor de edición
      
      toast.success("Calificación actualizada correctamente");
      
    } catch (error) {
      console.error('Error al guardar la calificación:', error);
      alert('Error al guardar la calificación');
    }
  };

  // Obtener el período académico actual
  const {
    data: currentPeriod,
    isLoading: isLoadingPeriod,
    error: periodError,
  } = useQuery<DashboardAcademicPeriod | null>({
    queryKey: ["currentAcademicPeriod"],
    queryFn: async () => {
      // SOLO usar el período con isCurrent: true
      console.log('🔍 [Dashboard] Buscando período con isCurrent: true...');
      const period = await dashboardService.getActiveAcademicPeriod();
      
      if (!period) {
        console.error('❌ [Dashboard] No se encontró ningún período con isCurrent: true');
        return null;
      }
      
      console.log('✅ [Dashboard] Período encontrado:', {
        id: period.id,
        name: period.name,
        isCurrent: period.isCurrent,
        unidadAsignada: (period as any).unidadAsignada
      });
      
      return period;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Initialize expandedGrados with first grade expanded using useMemo
  const [expandedGrados, setExpandedGrados] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    initial["grado-0"] = true;
    return initial;
  });
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "grades" | "habitos" | "extraescolar">("info"); // 'info', 'grades', or 'extraescolar'
  const [extraescolarGrades, setExtraescolarGrades] = useState<Record<string, { id: string; valor: ValorConceptual; materiaId: string }>>({});
  const [habitEvaluationsGrades, setHabitEvaluationsGrades] = useState<Record<string, { id: string; valor: ValorConceptual; evaluacionHabitoId: string }>>({});
  const [extraescolarHabitGrades, setExtraescolarHabitGrades] = useState<Record<string, { id: string; valor: ValorConceptual; evaluacionHabitoId: string }>>({});
  const [grades, setGrades] = useState<CalificacionResponse[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [evaluationPeriods, setEvaluationPeriods] = useState<
    Array<{ id: string; name: string }>
  >([
    { id: "PARCIAL_1", name: "Primer Parcial" },
    { id: "PARCIAL_2", name: "Segundo Parcial" },
    { id: "RECUPERATORIO", name: "Recuperatorio" },
    { id: "FINAL", name: "Examen Final" },
  ]);
  const [newGrade, setNewGrade] = useState<GradeFormData>({
    materiaId: "",
    tipoCalificacion: "NUMERICA",
    tipoEvaluacion: "PARCIAL_1", // Este valor se actualizará cuando se carguen los períodos
    calificacion: undefined,
    valorConceptual: undefined,
    comentario: "",
  });

  // Estados para hábitos
  const [hogarEvaluations, setHogarEvaluations] = useState<any[]>([]);
  const [habitoEvaluations, setHabitoEvaluations] = useState<any[]>([]);
  const [loadingHabitGrades, setLoadingHabitGrades] = useState(false);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const { user } = useAuth();

  const toggleGrado = (gradoId: string) => {
    setExpandedGrados((prev) => ({
      ...prev,
      [gradoId]: !prev[gradoId],
    }));
  };

  const closeStudentModal = () => {
    setSelectedStudent(null);
    setActiveTab("info");
    setNewGrade({
      materiaId: "",
      tipoCalificacion: "NUMERICA",
      tipoEvaluacion: evaluationPeriods[0]?.id || "PARCIAL_1",
      calificacion: undefined,
      valorConceptual: undefined,
      comentario: "",
    });
    // Resetear evaluaciones de hábitos
    setHabitEvaluationsGrades({});
    setHogarEvaluations([]);
    setHabitoEvaluations([]);
  };

  // Cargar los períodos académicos disponibles
  const loadEvaluationPeriods = async (periodoId: string) => {
    if (!periodoId) return;

    try {
      // Obtener los períodos académicos
      const periods = await academicPeriodService.getAllPeriods();

      if (periods && periods.length > 0) {
        // Mapear los períodos al formato esperado por el componente
        const formattedPeriods = periods.map((period) => ({
          id: period.id,
          name: period.name,
        }));
        setEvaluationPeriods(formattedPeriods);
      } else {
        // Si no hay períodos definidos, usar valores por defecto
        console.warn(
          "No se encontraron períodos académicos. Usando valores por defecto."
        );
        setEvaluationPeriods([
          { id: "PARCIAL_1", name: "Primer Parcial" },
          { id: "PARCIAL_2", name: "Segundo Parcial" },
          { id: "RECUPERATORIO", name: "Recuperatorio" },
          { id: "FINAL", name: "Examen Final" },
        ]);
      }
    } catch (error) {
      console.error("Error al cargar los períodos académicos:", error);
      // Usar valores por defecto en caso de error
      setEvaluationPeriods([
        { id: "PARCIAL_1", name: "Primer Parcial" },
        { id: "PARCIAL_2", name: "Segundo Parcial" },
        { id: "RECUPERATORIO", name: "Recuperatorio" },
        { id: "FINAL", name: "Examen Final" },
      ]);

      // Mostrar mensaje de error al usuario
      toast.error(
        "No se pudieron cargar los períodos académicos. Usando valores por defecto."
      );
    }
  };

  // Load grades for a student
  const loadStudentGrades = async (studentId: string, periodoId: string) => {
    try {
      setIsLoadingGrades(true);
      
      // Load regular and extracurricular grades
      const grades = await gradeService.getByStudent(studentId, periodoId);
      
      // Load habit grades using the new endpoint
      setLoadingHabitGrades(true);
      const habitData = await gradeService.getHabitGrades(studentId, periodoId);
      
      // 🔥 IMPORTANTE: Obtener TODOS los hábitos disponibles de la base de datos
      const todasLasMaterias = await dashboardService.getMaterias();
      
      // 🔥 FILTRAR: Obtener solo las materias que son hábitos (usando mismo mapeo que PDF)
      
      // IDs directos de la base de datos (mismo enfoque que PDF)
      const HOGAR_ID = "e133dce1-bb77-4b05-bdcb-0dc5d4c5df19";
      const HABITO_ID = "16b47d65-2cb9-4c2e-8779-9e2f5576d896";
      const EXTRACURRICULAR_ID = "d4965c36-c72a-43bb-8645-0e671df356c2";
      
      let habitosMaterias = todasLasMaterias.filter((materia: any) => {
        return materia.tipoMateriaId === HOGAR_ID || 
               materia.tipoMateriaId === HABITO_ID || 
               materia.tipoMateriaId === EXTRACURRICULAR_ID ||
               materia.esExtracurricular === true;
      });
      
      // 🔥 SI NO HAY MATERIAS DISPONIBLES, USAR LOS HÁBITOS CON CALIFICACIONES
      if (habitosMaterias.length === 0 && habitData.length > 0) {
        console.log('🔥 Dashboard - No hay materias disponibles, usando hábitos con calificaciones');
        habitosMaterias = habitData.map((h: any) => ({
          id: h.evaluacionHabitoId || h.id,
          nombre: h.nombre || h.materia?.nombre || 'Hábito sin nombre',
          tipoMateriaId: h.tipoMateriaId || h.materia?.tipoMateriaId,
          esExtracurricular: h.esExtracurricular || false,
          // Propiedades requeridas por MateriaResponse (valores por defecto)
          docenteId: '',
          materiaId: h.evaluacionHabitoId || h.id,
          seccion: '',
          horario: '',
          descripcion: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          grados: h.materia?.grados || [],
          tipoMateria: h.tipoMateria || h.materia?.tipoMateria || null
        })) as any;
      }
      
      // 🔥 DEBUG: Mostrar todos los hábitos disponibles
      console.log('🔍 Dashboard - Todas las materias:', todasLasMaterias.length);
      console.log('🔍 Dashboard - Materias de hábitos:', habitosMaterias.length);
      console.log('🔍 Dashboard - Hábitos con calificaciones:', habitData.length);
      
      // 🔥 Combinar: mostrar todos los hábitos, pero enriquecer los que tienen calificaciones
      let habitosCombinados = habitosMaterias.map((materia: any) => {
        // Buscar si esta materia tiene calificaciones como hábito
        const habitConCalificacion = habitData.find((h: any) => h.evaluacionHabitoId === materia.id);
        
        if (habitConCalificacion) {
          // Si tiene calificaciones, usar esos datos
          return habitConCalificacion;
        } else {
          // Si no tiene calificaciones, crear estructura básica
          return {
            ...materia,
            nombre: materia.nombre,
            evaluacionHabitoId: materia.id,
            u1: null,
            u2: null,
            u3: null,
            u4: null,
            comentario: null,
            calificaciones: [],
            materia: materia, // ← Mantener referencia a la materia
            tipo: materia.tipoMateria?.nombre || 'SIN TIPO',
            tipoMateriaNombre: materia.tipoMateria?.nombre || 'SIN TIPO'
          };
        }
      });
      
      // 🔥 IMPORTANTE: NO FILTRAR POR GRADO para coincidir con el PDF
      // El PDF muestra todos los hábitos con calificaciones sin filtrar por grado
      // El dashboard debe hacer lo mismo para mantener consistencia
      console.log(`🔍 Dashboard - Hábitos totales (sin filtrar por grado): ${habitosCombinados.length}`);
      console.log('🔍 Dashboard - Tipos de hábitos encontrados:', [...new Set(habitosCombinados.map((h: any) => h.tipo))]);
      console.log('🔍 Dashboard - Nombres de hábitos:', habitosCombinados.map((h: any) => h.nombre));
      
      setHabitGrades(habitosCombinados);
      setLoadingHabitGrades(false);

      // Map the grades to the expected format
      const mappedGrades = grades.map((g: any) => {
        // Debug: mostrar el período actual
        console.log('🔍 currentPeriod:', currentPeriod);
        
        // Determinar la unidad basada en el tipoEvaluacion y la unidad del período actual
        let unidad = '';
        if (currentPeriod && 'unidadAsignada' in currentPeriod && currentPeriod.unidadAsignada) {
          // Si el tipoEvaluacion coincide con un ID de período, usar la unidad del período actual
          if (g.tipoEvaluacion === currentPeriod.id) {
            unidad = currentPeriod.unidadAsignada;
          } else {
            // Mapeo de tipos de evaluación a unidades (fallback)
            const evaluationToUnitMap: Record<string, string> = {
              'PARCIAL_1': 'u1',
              'PARCIAL_2': 'u2', 
              'PARCIAL_3': 'u3',
              'PARCIAL_4': 'u4',
              'EXAMEN_FINAL': 'u4',
              'TRABAJO_FINAL': 'u4'
            };
            unidad = evaluationToUnitMap[g.tipoEvaluacion] || currentPeriod.unidadAsignada;
          }
        } else {
          // Fallback si no hay unidad asignada en el período
          const evaluationToUnitMap: Record<string, string> = {
            'PARCIAL_1': 'u1',
            'PARCIAL_2': 'u2', 
            'PARCIAL_3': 'u3',
            'PARCIAL_4': 'u4',
            'EXAMEN_FINAL': 'u4',
            'TRABAJO_FINAL': 'u4'
          };
          unidad = evaluationToUnitMap[g.tipoEvaluacion] || '';
        }

        console.log('🔍 Asignando unidad:', unidad, 'para tipoEvaluacion:', g.tipoEvaluacion);

        // Si el backend no devuelve unidad, usar la determinada por el frontend
        const unidadFinal = g.unidad || unidad;
        
        console.log('🔍 Mapping grade - backend unidad:', g.unidad, 'frontend unidad:', unidad, 'final:', unidadFinal);
        
        const mappedGrade = {
          ...g,
          unidad: unidadFinal, // Usar la unidad correcta aunque el backend no la guarde
          materia: {
            id: g.materia?.id || g.materiaId,
            nombre: g.materia?.nombre || 'Sin materia',
            tipoMateria: g.materia?.tipoMateria || { nombre: 'REGULAR' }
          },
          estudiante: {
            id: g.estudianteId,
            nombre: selectedStudent?.nombre || '',
            apellido: selectedStudent?.apellido || '',
            grados: selectedStudent?.grados || []
          },
          periodo: {
            id: g.periodoId,
            name: currentPeriod?.name || ''
          },
          docente: {
            id: g.docenteId || '',
            nombre: 'Docente'
          }
        };
        
        return mappedGrade;
      });

      // Separate regular and extracurricular grades
      const regularGrades: CalificacionResponse[] = [];
      const extraGrades: Record<string, { id: string; valor: ValorConceptual; materiaId: string }> = {};

      mappedGrades.forEach((g: any) => {
        const esExtraescolar = g.esExtraescolar || isExtraescolar(g.materiaId);

        if (esExtraescolar && g.materia?.nombre) {
          extraGrades[g.materia.nombre] = {
            id: g.id,
            valor: g.valorConceptual || "",
            materiaId: g.materia.id
          };
        } else {
          regularGrades.push(g);
        }
      });

      // Separar las evaluaciones de hábitos por tipo (usando mismo enfoque que PDF)
      
      const hogarEvals = habitosCombinados.filter((h: any) => {
        return h.tipoMateriaId === HOGAR_ID || 
               h.tipo === 'HOGAR' ||
               h.tipoMateriaNombre === 'HOGAR' ||
               h.tipo === 'CASA'; // ← Agregar 'CASA' que es lo que viene del backend
      });
      
      const habitoEvals = habitosCombinados.filter((h: any) => {
        return h.tipoMateriaId === HABITO_ID || 
               h.tipo === 'HABITO' ||
               h.tipoMateriaNombre === 'HABITO' ||
               h.tipo === 'APRENDIZAJE' || // ← Agregar 'APRENDIZAJE' que es lo que viene del backend
               h.tipo === 'COMPORTAMIENTO'; // ← Agregar 'COMPORTAMIENTO' que es lo que viene del backend
      });
      
      console.log('🔍 Dashboard - Hábitos CASA (hogarEvals):', hogarEvals.length, hogarEvals.map((h: any) => h.nombre));
      console.log('🔍 Dashboard - Hábitos APRENDIZAJE/COMPORTAMIENTO (habitoEvals):', habitoEvals.length, habitoEvals.map((h: any) => h.nombre));
      
      // Cargar evaluaciones de hábitos regulares existentes
      const habitEvaluationsGradesData: Record<string, { id: string; valor: ValorConceptual; evaluacionHabitoId: string }> = {};
      habitoEvals.forEach((evaluacion: any) => {
        // Revisar todos los campos (u1, u2, u3, u4) para encontrar el valor guardado
        const valorGuardado = evaluacion.u1 || evaluacion.u2 || evaluacion.u3 || evaluacion.u4;
        if (valorGuardado) {
          habitEvaluationsGradesData[evaluacion.evaluacionHabitoId] = {
            id: evaluacion.id || "",
            valor: valorGuardado,
            evaluacionHabitoId: evaluacion.evaluacionHabitoId
          };
        }
      });
      
      // Separar evaluaciones extracurriculares de hábitos
      const extraescolarEvals = habitosCombinados.filter((h: any) => {
        return h.tipoMateriaId === EXTRACURRICULAR_ID || 
               h.tipo === 'EXTRACURRICULAR' ||
               h.tipoMateriaNombre === 'EXTRACURRICULAR' ||
               h.esExtracurricular === true;
      });
      
      // Cargar evaluaciones extracurriculares existentes
      const extraescolarHabitGradesData: Record<string, { id: string; valor: ValorConceptual; evaluacionHabitoId: string }> = {};
      extraescolarEvals.forEach((evaluacion: any) => {
        // Revisar todos los campos (u1, u2, u3, u4) para encontrar el valor guardado
        const valorGuardado = evaluacion.u1 || evaluacion.u2 || evaluacion.u3 || evaluacion.u4;
        // 🔍 IMPORTANTE: Cargar TODAS las evaluaciones extracurriculares, no solo las que tienen valor
        // Esto asegura que el estado contenga todas las evaluaciones aunque vengan con null del backend
        extraescolarHabitGradesData[evaluacion.evaluacionHabitoId] = {
          id: evaluacion.id || "",
          valor: valorGuardado || "" as ValorConceptual, // Valor vacío si no tiene nada guardado
          evaluacionHabitoId: evaluacion.evaluacionHabitoId
        };
      });
      
      setGrades(regularGrades);
      setExtraescolarGrades(extraGrades);
      setHogarEvaluations(hogarEvals);
      setHabitoEvaluations(habitoEvals);
      setHabitEvaluationsGrades(habitEvaluationsGradesData); // ← Nuevo: cargar hábitos regulares
      setExtraescolarHabitGrades(extraescolarHabitGradesData);
      
    } catch (error) {
      console.error("Error al cargar calificaciones del estudiante:", error);
      toast.error("No se pudieron cargar las calificaciones");
    } finally {
      setIsLoadingGrades(false);
      setLoadingHabitGrades(false);
    }
  };

  // Effect to load grades and evaluation periods when student or period changes
  useEffect(() => {
    if (selectedStudent && currentPeriod) {
      loadStudentGrades(selectedStudent.id, currentPeriod.id);
      loadEvaluationPeriods(currentPeriod.id);
      // Load habit grades using the same logic as in loadStudentGrades
      setLoadingHabitGrades(true);
      gradeService.getHabitGrades(selectedStudent.id, currentPeriod.id)
        .then(habitData => {
          setHabitGrades(habitData);
          setLoadingHabitGrades(false);
        })
        .catch(error => {
          console.error('Error loading habit grades:', error);
          setLoadingHabitGrades(false);
        });
    }
  }, [selectedStudent, currentPeriod]);

  // Helper function to get display text for valorConceptual
  const getValorConceptualText = (value: ValorConceptual): string => {
    switch (value) {
      case "DESTACA":
        return "Destaca";
      case "AVANZA":
        return "Avanza";
      case "NECESITA_MEJORAR":
        return "Necesita Mejorar";
      case "INSATISFACTORIO":
        return "Insatisfactorio";
      default:
        return value;
    }
  };

  // Set initial evaluation period when periods are loaded
  useEffect(() => {
    if (evaluationPeriods.length > 0) {
      setNewGrade((prev) => ({
        ...prev,
        tipoEvaluacion: evaluationPeriods[0].id,
      }));
    }
  }, [evaluationPeriods]);

  // Obtener datos del dashboard
  // Obtener perfil del docente
  const { data: teacherProfile } = useQuery<TeacherProfile | null>({
    queryKey: ["teacherProfile"],
    queryFn: () => dashboardService.getTeacherProfile(),
  });

  // Obtener grados/secciones
  const {
    data: gradosData = [],
    isLoading: isLoadingGrados,
    error: gradosError,
  } = useQuery<GradoConMaterias[]>({
    queryKey: ["grados"],
    queryFn: async () => {
      const data = await dashboardService.getGradosConMaterias();
      return data.map((grado) => ({
        ...grado,
        materias: grado.materias.map((materia: any) => ({
          ...materia,
          id: String(materia.id), // Convert id to string to match our interface
        })),
      }));
    },
    enabled: !!currentPeriod, // Only run when we have a current period
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: (failureCount, error: any) => {
      // Don't retry network errors immediately, wait longer
      if (error?.isNetworkError) {
        return failureCount < 3; // Max 3 retries for network errors
      }
      return failureCount < 2; // Max 2 retries for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
  });

  // Obtener bimestres del backend para el período actual
  const {
    data: bimestres = [],
    isLoading: isLoadingBimestres,
    error: bimestresError,
  } = useQuery<Bimestre[]>({
    queryKey: ["bimestres", currentPeriod?.id],
    queryFn: async () => {
      if (!currentPeriod?.id) {
        return [];
      }
      try {
        const data = await dashboardService.getBimestres(currentPeriod.id);
        return data;
      } catch (error) {
        console.error("❌ Error al obtener los bimestres:", error);
        return [];
      }
    },
    enabled: !!currentPeriod?.id, // Solo ejecutar si hay un ID de período
    staleTime: 5 * 60 * 1000, // 5 minutos de caché
    retry: (failureCount, error: any) => {
      if (error?.isNetworkError) {
        return failureCount < 3;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Convert the data to use our extended types
  const grados = useMemo<GradoInfo[]>(() => {
    return gradosData.map((grado: GradoConMaterias) => {
      const materias = grado.materias.map((materia: any): MateriaBase => {
        const baseMateria = materia.materia || materia;
        return {
          id: String(baseMateria.id || ""),
          nombre: baseMateria.nombre || "Sin nombre",
          descripcion: baseMateria.descripcion || "",
          grado: baseMateria.grado || grado.grado,
          nivel: baseMateria.nivel || "",
          seccion: materia.seccion || baseMateria.seccion || "",
          docenteId: 0, // Default value as number to match MateriaBase
          estudiantes: 0,
        };
      });

      return {
        ...grado,
        materias,
        estudiantes: grado.estudiantes || [],
      } as unknown as GradoInfo; // Type assertion to handle the conversion
    });
  }, [gradosData]);

  // Obtener estadísticas bimestrales
  const {
    data: estadisticasBimestrales,
    isLoading: isLoadingEstadisticas,
    error: estadisticasError,
  } = useQuery<EstadisticasBimestrales>({
    queryKey: ["estadisticasBimestrales"],
    queryFn: () => dashboardService.getEstadisticasBimestrales(),
  });

  // Actualizar el estado de carga y errores
  const isLoading =
    isLoadingGrados ||
    isLoadingEstadisticas ||
    isLoadingPeriod ||
    isLoadingBimestres;

  // Mostrar todos los grados disponibles - use useMemo instead of useEffect
  const filteredGrados = useMemo(() => {
    console.log('🔍 Dashboard - filteredGrados - grados:', grados?.length || 0, 'teacherProfile:', teacherProfile?.materias?.length || 0);
    
    // Si no hay grados pero hay materias, mostrar un grado por defecto
    const hasMaterias = teacherProfile?.materias && teacherProfile.materias.length > 0;

    if (grados.length === 0 && hasMaterias) {
      console.log("No se encontraron grados, mostrando materias sin agrupar");
      const defaultGrado: GradoConMaterias = {
        grado: "Sin grado asignado",
        nivel: "N/A",
        seccion: "N/A",
        materias: teacherProfile!.materias!.map((m) => {
          const materia = m.materia || m;
          return {
            id: String(materia.id || ""),
            nombre: materia.nombre || "Sin nombre",
            descripcion: "descripcion" in materia ? String(materia.descripcion || "") : "",
            grado: "grado" in materia ? String(materia.grado || "N/A") : "N/A",
            nivel: "nivel" in materia ? String(materia.nivel || "N/A") : "N/A",
            seccion: "seccion" in materia ? String(materia.seccion || "N/A") : "N/A",
            docenteId: "docenteId" in materia ? Number(materia.docenteId || 0) : 0,
            estudiantes: "estudiantes" in materia ? Number(materia.estudiantes || 0) : 0,
          };
        }),
        totalEstudiantes: 0,
        estudiantes: [],
      };
      console.log('🔍 Dashboard - created default grado with materias:', defaultGrado.materias.length);
      return [defaultGrado];
    } else {
      console.log('🔍 Dashboard - returning grados:', grados.length);
      return grados as unknown as GradoConMaterias[];
    }
  }, [grados, teacherProfile]);

  // Filter students based on search term - use useMemo instead of useEffect
  const filteredStudents = useMemo(() => {
    console.log('🔍 Dashboard - filteredStudents - students:', students?.length || 0, 'searchTerm:', searchTerm);
    
    if (!students) {
      return [];
    }

    if (!searchTerm) {
      console.log('🔍 Dashboard - returning all students:', students.length);
      return students;
    }

    const term = searchTerm.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.nombre?.toLowerCase().includes(term) ||
        student.apellido?.toLowerCase().includes(term) ||
        student.dni?.includes(term)
    );
    
    console.log('🔍 Dashboard - filtered result:', filtered.length);
    return filtered;
  }, [students, searchTerm]);

  const [classGrades, setClassGrades] = useState<CalificacionResponse[]>([]);
  const [materias, setMaterias] = useState<MateriaAsignada[]>([]);
  const [habitGrades, setHabitGrades] = useState<any[]>([]);
  
  // Estados para separar las evaluaciones por tipo

  // Fetch materias from database with debouncing to reduce API calls
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const fetchMaterias = async () => {
      try {
        setLoadingMaterias(true);
        const materiasData = await dashboardService.getMaterias();
        setMaterias(materiasData);
      } catch (error) {
        console.error('Error fetching materias:', error);
        toast.error('Error al cargar las materias');
      } finally {
        setLoadingMaterias(false);
      }
    };

    // Debounce the API call to reduce concurrent requests
    timeoutId = setTimeout(fetchMaterias, 100);

    return () => clearTimeout(timeoutId);
  }, []); // Only run once on mount

  // Function to check if a materia is extracurricular
  const isExtraescolar = (materiaId: string) => {
    // Primero buscar en el array materias (datos cargados de API)
    let materia = materias.find(m => String(m.id) === materiaId);
    
    // Si no se encuentra, buscar en teacherProfile.materias
    if (!materia && teacherProfile?.materias) {
      materia = teacherProfile.materias.find((m: any) => String(m.materiaId) === materiaId);
      
      // Si encontramos la materia en teacherProfile, extraer la información correcta
      if (materia) {
        const materiaData = materia.materia || materia;
        
        // Crear un objeto con la estructura esperada
        materia = {
          ...materia,
          materia: materiaData
        };
      }
    }
    
    // Obtener el nombre de la materia (manejar ambas estructuras)
    const materiaNombre = materia?.materia?.nombre || (materia as any)?.nombre || '';
    
    // Primero verificar por tipoMateria
    if (materia?.materia?.tipoMateria?.nombre === 'EXTRAESCOLAR') {
      console.log('🔍 isExtraescolar - Detectado por tipoMateria: EXTRAESCOLAR');
      return true;
    }
    
    // Si no, verificar por nombre de materia extracurricular
    if (materiaNombre) {
      // Lista de materias extracurriculares según academicData.ts
      const extracurricularNames = [
        'comprensión de lectura',
        'lógica matemática', 
        'moral cristiana',
        'programa de lectura',
        'razonamiento verbal'
      ];
      
      const isExtracurricularByName = extracurricularNames.some(name => materiaNombre.toLowerCase().includes(name));
      console.log('🔍 isExtraescolar - Verificando por nombre:', {
        materiaNombre,
        isExtracurricularByName
      });
      
      return isExtracurricularByName;
    }
    
    console.log('🔍 isExtraescolar - No se detectó como extracurricular');
    return false;
  };

  // Function to get extracurricular subjects for a specific grade
  const getExtraescolarMaterias = useCallback((grado: string) => {
    if (!grado || loadingMaterias) return [];
    
    // Filter subjects that are marked as extracurricular and belong to this grade
    return materias.filter(materia => {
      // Check by tipoMateria first
      if (materia.materia?.tipoMateria?.nombre === 'EXTRAESCOLAR') {
        return materia.seccion === grado;
      }
      
      // Check by name (same logic as isExtraescolar)
      if (materia.materia?.nombre) {
        const materiaNombre = materia.materia.nombre.toLowerCase();
        const extracurricularNames = [
          'comprensión de lectura',
          'lógica matemática', 
          'moral cristiana',
          'programa de lectura',
          'razonamiento verbal'
        ];
        
        return extracurricularNames.some(name => materiaNombre.includes(name)) && materia.seccion === grado;
      }
      
      return false;
    });
  }, [materias, loadingMaterias]);

  // Fetch grades for the selected class context
  useEffect(() => {
    const fetchClassGrades = async () => {
      if (!selectedGrade || !currentPeriod || !selectedBimester) {
        setClassGrades([]);
        return;
      }

      // Parse the selected grade
      const [grado, nivel, seccion] = selectedGrade.split("|");
      const gradoObj = filteredGrados.find(
        g => g.grado == grado && g.nivel == nivel && g.seccion == seccion
      );

      // Get the first materia for this grade
      const materia = gradoObj?.materias?.[0];

      if (materia?.id) {
        try {
          const bimestreObj = bimestres.find(b => b.numero.toString() === selectedBimester);
          
          if (bimestreObj && currentPeriod?.id) {
            // Format the grade parameter as expected by the backend (e.g., "1" for grade, "Primaria" for level)
            const params = {
              materiaId: materia.id,
              grado: grado,
              nivel: nivel,
              seccion: seccion,
              periodoId: currentPeriod.id
            };
            
            // Format the grade parameter to include both grade and level
            const gradoCompleto = `${grado}° ${nivel}${seccion ? ` ${seccion}` : ''}`;
            
            // Use the new endpoint to get grades by materia, grade, and period
            const response = await gradeService.getByMateriaGradoPeriodo(
              materia.id,     // materiaId
              gradoCompleto,  // grado (e.g., "1° Primaria A")
              currentPeriod.id, // periodoId
              nivel          // nivel (e.g., "Primaria")
            );
            
            // Process the response
            
            // Transform the response to match the CalificacionResponse type
            const transformedGrades: CalificacionResponse[] = response.flatMap(item => 
              item.calificaciones.map(cal => ({
                id: cal.id,
                estudianteId: item.estudiante.id,
                materiaId: cal.materia.id,
                periodoId: cal.periodo.id,
                docenteId: cal.docente.id,
                tipoCalificacion: cal.tipoCalificacion,
                tipoEvaluacion: cal.tipoEvaluacion,
                calificacion: cal.calificacion,
                valorConceptual: cal.valorConceptual,
                comentario: cal.comentario,
                fecha: cal.fecha,
                estudiante: {
                  id: item.estudiante.id,
                  nombre: item.estudiante.nombre,
                  apellido: item.estudiante.apellido,
                  dni: item.estudiante.dni,
                  grados: [item.estudiante.grado]
                },
                materia: {
                  id: cal.materia.id,
                  nombre: cal.materia.nombre,
                  tipoMateria: cal.materia.tipoMateria
                },
                periodo: {
                  id: cal.periodo.id,
                  name: cal.periodo.name
                },
                docente: {
                  id: cal.docente.id,
                  nombre: cal.docente.nombre,
                  apellido: cal.docente.apellido
                }
              } as CalificacionResponse))
            );

            setClassGrades(transformedGrades);

            // Update students list from the response
            const studentsFromGrades = response.map(item => ({
              id: item.estudiante.id,
              nombre: item.estudiante.nombre,
              apellido: item.estudiante.apellido,
              email: '',
              dni: item.estudiante.dni || '',
              grados: [item.estudiante.grado],
              activo: true,
              secciones: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }));

            setStudents(prevStudents => {
              const existingIds = new Set(prevStudents.map(s => s.id));
              const newStudents = studentsFromGrades.filter(s => !existingIds.has(s.id));
              return [...prevStudents, ...newStudents];
            });
          }
        } catch (error) {
          console.error("Error fetching class grades:", error);
          toast.error("No se pudieron cargar las calificaciones");
          setClassGrades([]);
        }
      }
    };

    fetchClassGrades();
  }, [selectedGrade, selectedBimester, currentPeriod?.id]);

  // Auto-select current bimestre based on current academic period
  useEffect(() => {
    console.log('🔍 useEffect - bimestres:', bimestres.length, 'currentPeriod:', currentPeriod);
    
    if (bimestres.length > 0 && currentPeriod) {
      // Si el período actual tiene unidadAsignada, usarla para determinar el bimestre
      if (currentPeriod.unidadAsignada) {
        const unidadToBimestreMap: Record<string, number> = {
          'u1': 1,
          'u2': 2,
          'u3': 3,
          'u4': 4
        };
        
        const bimestreActual = unidadToBimestreMap[currentPeriod.unidadAsignada] || 1;
        
        console.log('🔍 Auto-selecting bimestre based on current period:', {
          currentPeriodName: currentPeriod.name,
          currentPeriodUnidad: currentPeriod.unidadAsignada,
          bimestreActual
        });
        
        setSelectedBimester(bimestreActual.toString());
      } else {
        // Fallback: calcular por fecha si no hay unidad asignada
        const hoy = new Date();
        const fechaInicio = new Date(currentPeriod.startDate);
        const fechaFin = new Date(currentPeriod.endDate);
        
        const duracionTotal = fechaFin.getTime() - fechaInicio.getTime();
        const duracionBimestre = duracionTotal / 4;
        
        const tiempoTranscurrido = hoy.getTime() - fechaInicio.getTime();
        const bimestreActual = Math.min(4, Math.max(1, Math.ceil(tiempoTranscurrido / duracionBimestre)));
        
        console.log('🔍 Auto-selecting bimestre by date (fallback):', {
          currentDate: hoy.toISOString(),
          periodStart: fechaInicio.toISOString(),
          periodEnd: fechaFin.toISOString(),
          bimestreActual
        });
        
        setSelectedBimester(bimestreActual.toString());
      }
    }
  }, [bimestres, currentPeriod]);

  const getPromedioBimestre = (materia: Materia, bimestre: number): string => {
    switch (bimestre) {
      case 1:
        return materia.notasBimestre1?.toFixed(1) || "N/A";
      case 2:
        return materia.notasBimestre2?.toFixed(1) || "N/A";
      case 3:
        return materia.notasBimestre3?.toFixed(1) || "N/A";
      case 4:
        return materia.notasBimestre4?.toFixed(1) || "N/A";
      default:
        return "N/A";
    }
  };

  // Obtener la calificación actual de un estudiante
  const getCurrentGrade = (student: Estudiante) => {
    const grade = classGrades.find(g => g.estudianteId === student.id);
    if (!grade) return null;

    if (grade.tipoCalificacion === 'NUMERICA') {
      return grade.calificacion;
    }

    return grade.valorConceptual; // Return conceptual value if not numeric
  };

  // Show loading state
  // isLoading is already defined above


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Cargando información del dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show error if any
  const error = gradosError || periodError || estadisticasError;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 w-full max-w-md"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>
            No se pudieron cargar los datos del dashboard. Por favor, intente
            nuevamente más tarde.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const handleSaveGrade = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.group('=== INICIO handleSaveGrade ===');
    
    // Try to get the student ID from either selectedStudent or editingId
    const studentId = selectedStudent?.id || editingId;
    
    // Verificar si es extracurricular ANTES de continuar
    const esExtraescolar = isExtraescolar(newGrade.materiaId);
    console.log('🔍 handleSaveGrade - ¿Es extracurricular?:', esExtraescolar);
    console.log('🔍 handleSaveGrade - Materia:', newGrade.nombreMateria);

    try {
      if (!studentId || !currentPeriod?.id) {
        const errorMsg = `Faltan datos del estudiante o período. Estudiante: ${studentId}, Período: ${currentPeriod?.id}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      let updatedGrade: CalificacionResponse | undefined;
      
      if (editingId) {
        console.log('=== MODO EDICIÓN ===');
        console.log('Buscando calificación existente para actualizar...');
        
        // Buscar la calificación existente
        const gradeToUpdate = classGrades.find(
          grade => grade.estudianteId === studentId && 
                  grade.materiaId === newGrade.materiaId
        );

        console.log('Calificación encontrada para actualizar:', gradeToUpdate);

        if (gradeToUpdate) {
          console.log('=== PREPARANDO ACTUALIZACIÓN ===');
          console.log('ID de la calificación a actualizar:', gradeToUpdate.id);
          
          // Determinar la unidad basada en el tipoEvaluacion y la unidad del período actual
          let unidad = '';
          if (currentPeriod && 'unidadAsignada' in currentPeriod && currentPeriod.unidadAsignada) {
            // Si el tipoEvaluacion coincide con un ID de período, usar la unidad del período actual
            if (newGrade.tipoEvaluacion === currentPeriod.id) {
              unidad = currentPeriod.unidadAsignada;
            } else {
              // Mapeo de tipos de evaluación a unidades (fallback)
              const evaluationToUnitMap: Record<string, string> = {
                'PARCIAL_1': 'u1',
                'PARCIAL_2': 'u2', 
                'PARCIAL_3': 'u3',
                'PARCIAL_4': 'u4',
                'EXAMEN_FINAL': 'u4',
                'TRABAJO_FINAL': 'u4'
              };
              unidad = evaluationToUnitMap[newGrade.tipoEvaluacion] || currentPeriod.unidadAsignada;
            }
          } else {
            // Fallback si no hay unidad asignada en el período
            const evaluationToUnitMap: Record<string, string> = {
              'PARCIAL_1': 'u1',
              'PARCIAL_2': 'u2', 
              'PARCIAL_3': 'u3',
              'PARCIAL_4': 'u4',
              'EXAMEN_FINAL': 'u4',
              'TRABAJO_FINAL': 'u4'
            };
            unidad = evaluationToUnitMap[newGrade.tipoEvaluacion] || '';
          }
          
          console.log('Nuevos valores a guardar:', {
            tipoCalificacion: newGrade.tipoCalificacion,
            tipoEvaluacion: newGrade.tipoEvaluacion,
            calificacion: newGrade.calificacion,
            valorConceptual: newGrade.valorConceptual,
            comentario: newGrade.comentario,
            materiaId: newGrade.materiaId,
            periodoId: currentPeriod.id,
            unidad: unidad
          });

          try {
            console.log('Llamando a gradeService.update...');
            // Determinar si es una materia extracurricular
            const esExtraescolar = isExtraescolar(newGrade.materiaId);

            console.log('Actualizando calificación con esExtraescolar:', esExtraescolar, 'para materia:', newGrade.nombreMateria);
            
            const updateData: UpdateCalificacionRequest = {
              tipoCalificacion: newGrade.tipoCalificacion,
              tipoEvaluacion: newGrade.tipoEvaluacion,
              calificacion: newGrade.calificacion,
              valorConceptual: newGrade.valorConceptual as ValorConceptual,
              comentario: newGrade.comentario,
              materiaId: newGrade.materiaId,
              periodoId: currentPeriod.id,
              unidad: unidad, // Agregar la unidad determinada
              esExtraescolar: esExtraescolar // Usar el campo esExtraescolar
            };
            console.log('Datos para actualizar:', updateData);
            console.log('🔍 Enviando campo unidad:', updateData.unidad);
            updatedGrade = await gradeService.update(gradeToUpdate.id, updateData);
            
            console.log('=== RESPUESTA DEL SERVIDOR ===');
            console.log('Datos actualizados recibidos:', updatedGrade);
            
            if (!updatedGrade) {
              throw new Error('No se recibieron datos actualizados del servidor');
            }

            console.log('Actualizando estado local...');
            // Actualizar el estado local inmediatamente para una mejor experiencia de usuario
            setClassGrades(prevGrades => {
              const updatedGrades = prevGrades.map(grade => 
                grade.id === gradeToUpdate.id 
                  ? { ...grade, ...updatedGrade } 
                  : grade
              );
              console.log('Estado de classGrades después de actualizar:', updatedGrades);
              return updatedGrades;
            });
            
            toast.success("Calificación actualizada correctamente");
            console.log('Calificación actualizada con éxito');
          } catch (error) {
            const updateError = error as Error;
            console.error('Error al actualizar la calificación:', updateError);
            toast.error(`Error al actualizar: ${updateError.message || 'Error desconocido'}`);
            throw updateError; // Relanzar el error para que sea manejado por el catch externo
          }
        } else {
          const errorMsg = 'No se encontró la calificación para actualizar';
          console.error(errorMsg);
          toast.error(errorMsg);
        }
      } else {
        // Si no hay ID de edición, creamos una nueva calificación
        if (!selectedStudent) {
          throw new Error('No se pudo determinar el ID del estudiante');
        }
        
        // Determinar si es una materia extracurricular
        const esExtraescolar = isExtraescolar(newGrade.materiaId);
        
        // Determinar la unidad basada en el tipoEvaluacion y la unidad del período actual
        let unidad = '';
        if (currentPeriod && 'unidadAsignada' in currentPeriod && currentPeriod.unidadAsignada) {
          // Si el tipoEvaluacion coincide con un ID de período, usar la unidad del período actual
          if (newGrade.tipoEvaluacion === currentPeriod.id) {
            unidad = currentPeriod.unidadAsignada;
          } else {
            // Mapeo de tipos de evaluación a unidades (fallback)
            const evaluationToUnitMap: Record<string, string> = {
              'PARCIAL_1': 'u1',
              'PARCIAL_2': 'u2', 
              'PARCIAL_3': 'u3',
              'PARCIAL_4': 'u4',
              'EXAMEN_FINAL': 'u4',
              'TRABAJO_FINAL': 'u4'
            };
            unidad = evaluationToUnitMap[newGrade.tipoEvaluacion] || currentPeriod.unidadAsignada;
          }
        } else {
          // Fallback si no hay unidad asignada en el período
          const evaluationToUnitMap: Record<string, string> = {
            'PARCIAL_1': 'u1',
            'PARCIAL_2': 'u2', 
            'PARCIAL_3': 'u3',
            'PARCIAL_4': 'u4',
            'EXAMEN_FINAL': 'u4',
            'TRABAJO_FINAL': 'u4'
          };
          unidad = evaluationToUnitMap[newGrade.tipoEvaluacion] || '';
        }
        
        // Si es extracurricular, guardar como evaluación de hábito en lugar de calificación académica
        if (esExtraescolar) {
          console.log('🔍 handleSaveGrade - Detectada materia extracurricular, guardando como evaluación de hábito');
          
          // Buscar el evaluacionHabitoId correspondiente a esta materia extracurricular
          const materiaEncontrada = teacherProfile?.materias?.find((m: any) => String(m.materiaId) === newGrade.materiaId);
          let evaluacionHabitoId = '';
          
          if (materiaEncontrada) {
            // Buscar en las evaluaciones de hábitos extracurriculares
            const habitGrades = await gradeService.getHabitGrades(selectedStudent.id, currentPeriod.id);
            const extracurricularHabit = habitGrades.find((h: any) => 
              h.tipo === 'EXTRACURRICULAR' && 
              h.nombre === (materiaEncontrada.materia?.nombre || (materiaEncontrada as any).nombre)
            );
            
            if (extracurricularHabit) {
              evaluacionHabitoId = extracurricularHabit.evaluacionHabitoId;
              console.log('🔍 handleSaveGrade - evaluacionHabitoId encontrado:', evaluacionHabitoId);
            }
          }
          
          if (!evaluacionHabitoId) {
            console.error('🔍 handleSaveGrade - No se encontró evaluacionHabitoId para la materia extracurricular');
            toast.error("No se encontró la evaluación de hábito correspondiente para esta materia extracurricular");
            return;
          }
          
          // Usar la función existente para guardar como evaluación de hábito extracurricular
          await handleSaveExtraescolarHabitGrade(evaluacionHabitoId, newGrade.valorConceptual as ValorConceptual);
          console.log('🔍 handleSaveGrade - Evaluación extracurricular guardada correctamente como hábito');
          return;
        }

        // Si es extracurricular, verificar si ya existe una calificación para actualizarla
        let existingGradeForUpdate = null;
        if (esExtraescolar) {
          existingGradeForUpdate = classGrades.find(
            grade => grade.estudianteId === selectedStudent.id && 
                    grade.materiaId === newGrade.materiaId
          );
          console.log('🔍 handleSaveGrade - Buscando calificación existente para extracurricular:', existingGradeForUpdate);
        }

        if (existingGradeForUpdate) {
          // Actualizar calificación existente
          console.log('🔍 handleSaveGrade - Actualizando calificación extracurricular existente');
          
          const updateData: UpdateCalificacionRequest = {
            tipoCalificacion: newGrade.tipoCalificacion,
            tipoEvaluacion: newGrade.tipoEvaluacion,
            calificacion: newGrade.calificacion,
            valorConceptual: newGrade.valorConceptual as ValorConceptual,
            comentario: newGrade.comentario,
            materiaId: newGrade.materiaId,
            periodoId: currentPeriod.id,
            unidad: unidad,
            esExtraescolar: esExtraescolar
          };
          
          console.log('🔍 handleSaveGrade - Datos para actualizar extracurricular:', updateData);
          const updatedGrade = await gradeService.update(existingGradeForUpdate.id, updateData);
          console.log('🔍 handleSaveGrade - Calificación extracurricular actualizada:', updatedGrade);
          toast.success("Calificación extracurricular actualizada correctamente");
        } else {
          // Crear nueva calificación
          console.log('🔍 handleSaveGrade - Creando nueva calificación - esExtraescolar:', esExtraescolar);

          // Obtener el nombre real de la materia
          let nombreMateriaReal = newGrade.nombreMateria;
          if (!nombreMateriaReal) {
            // Buscar la materia en teacherProfile.materias
            const materiaEncontrada = teacherProfile?.materias?.find((m: any) => String(m.materiaId) === newGrade.materiaId);
            if (materiaEncontrada) {
              nombreMateriaReal = materiaEncontrada.materia?.nombre || (materiaEncontrada as any).nombre;
            }
            // Si no, buscar en el array materias
            else {
              const materiaGlobal = materias.find(m => String(m.id) === newGrade.materiaId);
              nombreMateriaReal = (materiaGlobal as any)?.nombre;
            }
          }

          const gradeData: CreateCalificacionRequest = {
            userMateriaId: newGrade.materiaId,
            estudianteId: selectedStudent.id,
            periodoId: currentPeriod.id,
            tipoCalificacion: newGrade.tipoCalificacion,
            tipoEvaluacion: newGrade.tipoEvaluacion,
            calificacion: newGrade.calificacion,
            valorConceptual: newGrade.valorConceptual as ValorConceptual,
            comentario: newGrade.comentario,
            unidad: unidad,
            esExtraescolar: esExtraescolar,
            nombreMateria: nombreMateriaReal
          };

          console.log('🔍 handleSaveGrade - nombreMateriaReal:', nombreMateriaReal);
          console.log('🔍 handleSaveGrade - esExtraescolar en gradeData:', gradeData.esExtraescolar);

          const newGradeResponse = await gradeService.create(gradeData);
          
          console.log('🔍 handleSaveGrade - esExtraescolar en respuesta:', newGradeResponse.esExtraescolar);
          console.log('🔍 handleSaveGrade - ¿La respuesta incluye esExtraescolar?:', 'esExtraescolar' in newGradeResponse);
          
          toast.success("Calificación guardada correctamente");
        }
      }

      // Forzar una recarga de los datos del servidor para asegurar consistencia
      await loadStudentGrades(studentId, currentPeriod.id);
      
      // Restablecer el formulario
      setNewGrade({
        materiaId: "",
        tipoCalificacion: "NUMERICA",
        tipoEvaluacion: evaluationPeriods[0]?.id || "PARCIAL_1",
        calificacion: undefined,
        valorConceptual: undefined,
        comentario: "",
      });
      
      // Limpiar el ID de edición
      setEditingId(null);

    } catch (error) {
      console.error("Error al guardar la calificación:", error);
      toast.error("Error al guardar la calificación");
    }
  };

  // Función para manejar la evaluación de hábitos
  const handleSaveHabitGrade = async (evaluacionHabitoId: string, valor: ValorConceptual) => {
    console.group('=== INICIO handleSaveHabitGrade ===');
    console.log('Datos recibidos:', {
      evaluacionHabitoId,
      valor,
      selectedStudentId: selectedStudent?.id,
      currentPeriodId: currentPeriod?.id,
      currentPeriod: currentPeriod,
      unidadAsignada: currentPeriod?.unidadAsignada
    });
    
    try {
      if (!selectedStudent?.id || !currentPeriod?.id) {
        throw new Error("Faltan datos del estudiante o período");
      }

      // Update local state immediately for better UX
      console.log('Actualizando estado local...');
      setHabitEvaluationsGrades(prev => {
        const newState = {
          ...prev,
          [evaluacionHabitoId]: {
            id: prev[evaluacionHabitoId]?.id || "", // Temporary ID if new
            valor: valor,
            evaluacionHabitoId: evaluacionHabitoId
          },
        };
        console.log('Estado local actualizado:', newState);
        return newState;
      });

      try {
        // Preparar los datos para enviar al backend
        // Determinar la unidad según el período actual
        let unidad = 'u1'; // valor por defecto
        if (currentPeriod && 'unidadAsignada' in currentPeriod && currentPeriod.unidadAsignada) {
          unidad = currentPeriod.unidadAsignada;
          console.log('🔍 Usando unidad del período actual:', unidad);
        } else {
          console.log('🔍 Período sin unidadAsignada, usando valor por defecto u1');
        }
        
        const habitGradeData: SaveHabitGradesRequest = {
          periodoId: currentPeriod.id,
          calificaciones: [
            {
              evaluacionHabitoId: evaluacionHabitoId,
              [unidad]: valor, // Usar la unidad dinámica
              comentario: "Evaluación de hábito"
            }
          ]
        };

        console.log('Enviando datos al backend:', habitGradeData);
        console.log('🔍 Unidad que se usará para guardar:', unidad);
        await gradeService.saveHabitGrades(selectedStudent.id, habitGradeData);

        console.log('Datos guardados exitosamente, recargando...');
        // Refresh grades to ensure we have the latest data
        await loadStudentGrades(
          selectedStudent.id,
          currentPeriod.id
        );
        toast.success("Evaluación de hábito guardada correctamente");
        console.log('=== FIN handleSaveHabitGrade (ÉXITO) ===');
      } catch (error) {
        console.error('Error al guardar en el backend:', error);
        // Revert local state on error
        setHabitEvaluationsGrades(prev => {
          const newState = { ...prev };
          delete newState[evaluacionHabitoId];
          console.log('Estado local revertido:', newState);
          return newState;
        });
        throw error;
      }
    } catch (error) {
      console.error("Error al guardar la evaluación de hábito:", error);
      toast.error("Error al guardar la evaluación de hábito");
      console.log('=== FIN handleSaveHabitGrade (ERROR) ===');
    } finally {
      console.groupEnd();
    }
  };

  // Función para manejar la evaluación de actividades extracurriculares
  const handleSaveExtraescolarHabitGrade = async (evaluacionHabitoId: string, valor: ValorConceptual) => {
    console.group('=== INICIO handleSaveExtraescolarHabitGrade ===');
    console.log('Datos recibidos:', {
      evaluacionHabitoId,
      valor,
      selectedStudentId: selectedStudent?.id,
      currentPeriodId: currentPeriod?.id
    });
    
    try {
      if (!selectedStudent?.id || !currentPeriod?.id) {
        throw new Error("Faltan datos del estudiante o período");
      }

      // Update local state immediately for better UX
      console.log('Actualizando estado local de extraescolares...');
      setExtraescolarHabitGrades(prev => {
        const newState = {
          ...prev,
          [evaluacionHabitoId]: {
            id: prev[evaluacionHabitoId]?.id || "", // Temporary ID if new
            valor: valor,
            evaluacionHabitoId: evaluacionHabitoId
          },
        };
        console.log('Estado local de extraescolares actualizado:', newState);
        return newState;
      });

      try {
        // Preparar los datos para enviar al backend
        // Determinar la unidad según el período actual
        let unidad = 'u1'; // valor por defecto
        if (currentPeriod && 'unidadAsignada' in currentPeriod && currentPeriod.unidadAsignada) {
          unidad = currentPeriod.unidadAsignada;
          console.log('🔍 Extraescolar - Usando unidad del período actual:', unidad);
        } else {
          console.log('🔍 Extraescolar - Período sin unidadAsignada, usando valor por defecto u1');
        }
        
        const habitGradeData: SaveHabitGradesRequest = {
          periodoId: currentPeriod.id,
          calificaciones: [
            {
              evaluacionHabitoId: evaluacionHabitoId,
              [unidad]: valor, // Usar la unidad dinámica
              comentario: "Evaluación de actividad extracurricular"
            }
          ]
        };

        console.log('Enviando datos de extraescolar al backend:', habitGradeData);
        console.log('🔍 Extraescolar - Unidad que se usará para guardar:', unidad);
        console.log('=== ANÁLISIS DEL PAYLOAD ===');
        console.log('periodoId:', habitGradeData.periodoId);
        console.log('calificaciones:', habitGradeData.calificaciones);
        console.log('Primera calificación:', habitGradeData.calificaciones[0]);
        console.log('evaluacionHabitoId:', habitGradeData.calificaciones[0].evaluacionHabitoId);
        console.log(`Campo ${unidad} (valor a guardar):`, (habitGradeData.calificaciones[0] as any)[unidad]);
        console.log('comentario:', habitGradeData.calificaciones[0].comentario);
        
        // 🔍 VERIFICACIÓN ESPECIAL PARA EXTRACURRICULARES
        console.log('=== VERIFICACIÓN EXTRACURRICULAR ===');
        console.log('¿Es evaluación extracurricular?', evaluacionHabitoId);
        console.log('¿El ID existe en las materias?', 'Sí, lo vimos en los logs anteriores');
        console.log('¿El backend debería procesarlo?', 'Sí, es una evaluación de hábito válida');
        console.log('=== FIN VERIFICACIÓN EXTRACURRICULAR ===');
        
        console.log('🔍 RESUMEN DE GUARDADO EXTRACURRICULAR:');
        console.log('- Estudiante ID:', selectedStudent.id);
        console.log('- Período ID:', currentPeriod.id);
        console.log('- Unidad asignada del período:', currentPeriod?.unidadAsignada);
        console.log('- Unidad que se usará:', unidad);
        console.log('- Evaluación ID:', evaluacionHabitoId);
        console.log('- Valor:', valor);
        
        await gradeService.saveHabitGrades(selectedStudent.id, habitGradeData);

        console.log('Datos extraescolares guardados exitosamente, verificando estado...');
        
        // Verificar el estado local ANTES de la recarga
        const estadoAntesDeRecargar = extraescolarHabitGrades[evaluacionHabitoId];
        console.log('Estado local ANTES de recargar:', estadoAntesDeRecargar);
        
        if (estadoAntesDeRecargar && estadoAntesDeRecargar.valor === valor) {
          console.log('✅ El estado local ya es correcto, no es necesario recargar');
          toast.success("Evaluación de actividad extracurricular guardada correctamente");
          console.log('=== FIN handleSaveExtraescolarHabitGrade (ÉXITO SIN RECARGA) ===');
          return;
        }
        
        console.log('⚠️ El estado local no coincide, recargando datos...');
        // Pequeño delay para asegurar que el backend procese los datos
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aumentado a 1 segundo
        
        console.log('=== INICIO RECARGA DE DATOS ===');
        // Refresh grades to ensure we have the latest data
        await loadStudentGrades(
          selectedStudent.id,
          currentPeriod.id
        );
        console.log('=== FIN RECARGA DE DATOS ===');
        
        // Después de recargar, verificar si el estado se actualizó correctamente
        const estadoDespuesDeRecargar = extraescolarHabitGrades[evaluacionHabitoId];
        console.log('Estado local DESPUÉS de recargar:', estadoDespuesDeRecargar);
        
        if (estadoDespuesDeRecargar && estadoDespuesDeRecargar.valor === valor) {
          console.log('✅ La recarga funcionó correctamente');
        } else {
          console.log('❌ La recarga no funcionó, restaurando estado local...');
          // Restaurar el estado local si la recarga no funcionó
          setExtraescolarHabitGrades(prev => ({
            ...prev,
            [evaluacionHabitoId]: {
              id: "",
              valor: valor,
              evaluacionHabitoId: evaluacionHabitoId
            }
          }));
        }
        toast.success("Evaluación de actividad extracurricular guardada correctamente");
        console.log('=== FIN handleSaveExtraescolarHabitGrade (ÉXITO) ===');
      } catch (error) {
        console.error('Error al guardar extraescolar en el backend:', error);
        // Revert local state on error
        setExtraescolarHabitGrades(prev => {
          const newState = { ...prev };
          delete newState[evaluacionHabitoId];
          console.log('Estado local de extraescolares revertido:', newState);
          return newState;
        });
        throw error;
      }
    } catch (error) {
      console.error("Error al guardar la evaluación de actividad extracurricular:", error);
      toast.error("Error al guardar la evaluación de actividad extracurricular");
      console.log('=== FIN handleSaveExtraescolarHabitGrade (ERROR) ===');
    } finally {
      console.groupEnd();
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-gray-50">
        {/* Sección del Período Académico Actual */}
        {isLoadingPeriod ? (
          <div className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 w-32 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ) : currentPeriod ? (
          <div className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentPeriod.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {format(
                        new Date(currentPeriod.startDate),
                        "d MMMM yyyy",
                        { locale: es }
                      )}{" "}
                      -{" "}
                      {format(new Date(currentPeriod.endDate), "d MMMM yyyy", {
                        locale: es,
                      })}
                    </span>
                    <Badge
                      variant={
                        currentPeriod.status === "active"
                          ? "default"
                          : "secondary"
                      }
                      className={`ml-2 ${currentPeriod.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : currentPeriod.status === "upcoming"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          : currentPeriod.status === "completed"
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }`}
                    >
                      {currentPeriod.status === "active"
                        ? "En Curso"
                        : currentPeriod.status === "upcoming"
                          ? "Próximo"
                          : currentPeriod.status === "completed"
                            ? "Completado"
                            : "Cancelado"}
                    </Badge>
                  </div>
                </div>
                {currentPeriod.isCurrent && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Período actual</span>
                  </div>
                )}
              </div>
              {currentPeriod.description && (
                <p className="mt-2 text-sm text-gray-600">
                  {currentPeriod.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  No hay un período académico activo actualmente.
                </p>
              </div>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-lg font-medium">
                Cargando datos del dashboard...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>
              No se pudieron cargar los datos del dashboard. Por favor, intente
              nuevamente más tarde.
            </p>
          </div>
        )}
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Liceo Cristiano Zacapaneco
                  </h1>
                  <p className="text-sm text-gray-600">
                    Panel de Control
                    {user ? ` - ${user.nombre || user.name || user.email}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user?.rol === "ADMIN" && (
                  <Link href="/academic-periods">
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Períodos
                    </Button>
                  </Link>
                )}
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    Cerrar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            {/* Academic Period Selector */}

            {currentPeriod && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Períodos Académicos (Bimestres)
                  </h2>
                  <div className="text-sm text-gray-500">
                    {currentPeriod.name} •{" "}
                    {format(new Date(currentPeriod.startDate), "dd/MM/yyyy")} -{" "}
                    {format(new Date(currentPeriod.endDate), "dd/MM/yyyy")}
                  </div>
                </div>

                {(() => {
                  if (isLoadingBimestres) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <Card key={i} className="border-2 border-gray-200">
                            <CardHeader className="pb-2">
                              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
                            </CardHeader>
                            <CardContent>
                              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2"></div>
                              <div className="h-2 w-3/4 bg-gray-100 rounded animate-pulse"></div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    );
                  } else if (bimestresError) {
                    return (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">
                              Error al cargar los períodos académicos. Intente
                              nuevamente.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (bimestres.length > 0) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {bimestres.map((bimestre) => (
                          <Card
                            key={bimestre.id || bimestre.numero}
                            className={`border-2 transition-all hover:shadow-md ${bimestre.estado === "activo"
                              ? "border-blue-500 bg-blue-50"
                              : bimestre.estado === "completado"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 bg-gray-50"
                              }`}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">
                                  {bimestre.nombre}
                                </CardTitle>
                                <Badge
                                  variant={
                                    bimestre.estado === "activo"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={`${bimestre.estado === "activo"
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                    : bimestre.estado === "completado"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                    }`}
                                >
                                  {bimestre.estado === "activo"
                                    ? "En Curso"
                                    : bimestre.estado === "completado"
                                      ? "Completado"
                                      : "Próximo"}
                                </Badge>
                              </div>
                              <CardDescription className="text-sm">
                                {format(
                                  new Date(bimestre.fechaInicio),
                                  "dd/MM/yyyy"
                                )}{" "}
                                -{" "}
                                {format(
                                  new Date(bimestre.fechaFin),
                                  "dd/MM/yyyy"
                                )}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              {bimestre.descripcion && (
                                <p className="text-sm text-gray-600 mb-3">
                                  {bimestre.descripcion}
                                </p>
                              )}
                              <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Progreso</span>
                                <span className="font-medium">
                                  {bimestre.progreso}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                <div
                                  className={`h-2.5 rounded-full ${bimestre.estado === "activo"
                                    ? "bg-blue-500"
                                    : bimestre.estado === "completado"
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                    }`}
                                  style={{ width: `${bimestre.progreso}%` }}
                                />
                              </div>
                              <div className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                                  <span className="text-gray-600">Inicio:</span>
                                  <span className="ml-1 font-medium">
                                    {format(
                                      new Date(bimestre.fechaInicio),
                                      "dd/MM/yy"
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                                  <span className="text-gray-600">Fin:</span>
                                  <span className="ml-1 font-medium">
                                    {format(
                                      new Date(bimestre.fechaFin),
                                      "dd/MM/yy"
                                    )}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              No se encontraron bimestres configurados para este
                              período académico.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
            <Tabs value={activeMainTab} onValueChange={(value) => setActiveMainTab(value as "grados")} className="space-y-6">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="grados">Grados</TabsTrigger>
              </TabsList>

              <TabsContent value="grados">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    Mis Grados - {selectedBimester}° Bimestre
                  </h2>
                </div>

                <div className="space-y-8">
                  {filteredGrados.length > 0 ? (
                    filteredGrados.map((grado, index) => (
                      <div
                        key={`grado-${index}-${grado.grado}-${grado.nivel}-${grado.seccion}`}
                        className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div
                          className="bg-gray-50 px-6 py-4 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleGrado(`grado-${index}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-semibold">
                                {isNaN(Number(grado.grado)) ? (
                                  // Si no es un número (ej: "Kinder"), mostramos solo el nombre del grado y la sección
                                  <>
                                    {grado.grado} {grado.seccion && `- Sección "${grado.seccion}"`}
                                  </>
                                ) : (
                                  // Si es un número (ej: "1"), mostramos el formato completo
                                  <>
                                    {grado.grado}° {grado.nivel}{" "}
                                    {grado.seccion && `- Sección "${grado.seccion}"`}
                                  </>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {grado.materias.length}{" "}
                                {grado.materias.length === 1
                                  ? "materia"
                                  : "materias"}{" "}
                                • {grado.totalEstudiantes}{" "}
                                {grado.totalEstudiantes === 1
                                  ? "estudiante"
                                  : "estudiantes"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-sm bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap"
                              >
                                {grado.materias.length}{" "}
                                {grado.materias.length === 1
                                  ? "Materia"
                                  : "Materias"}
                              </Badge>
                              <ChevronDown
                                className={`h-5 w-5 text-gray-500 transition-transform ${expandedGrados[`grado-${index}`]
                                  ? "transform rotate-180"
                                  : ""
                                  }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Student List */}
                        {expandedGrados[`grado-${index}`] && (
                          <div className="bg-white border-t">
                            <div className="px-6 py-3 bg-gray-50 border-b">
                              <h4 className="font-medium text-gray-700">
                                Lista de Estudiantes
                              </h4>
                            </div>
                            <div className="divide-y">
                              {grado.estudiantes &&
                                grado.estudiantes.length > 0 ? (
                                grado.estudiantes.map(
                                  (estudiante: Estudiante, idx: number) => (
                                    <div
                                      key={`estudiante-${estudiante.id || idx}`}
                                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                      onClick={() =>
                                        setSelectedStudent(estudiante)
                                      }
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="bg-blue-100 p-2 rounded-full">
                                            <User className="h-5 w-5 text-blue-600" />
                                          </div>
                                          <div>
                                            <p className="font-medium">
                                              {estudiante.nombre ||
                                                estudiante.firstName}{" "}
                                              {estudiante.apellido ||
                                                estudiante.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                              {estudiante.dni || "Sin DNI"}
                                            </p>
                                          </div>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-blue-600 hover:text-blue-800"
                                        >
                                          Ver detalles
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="p-4 text-center text-gray-500">
                                  No hay estudiantes registrados en este grado
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="divide-y">
                          {grado.materias.map(
                            (materia: MateriaBase, matIndex: number) => (
                              <div
                                key={`materia-${materia.id}-${matIndex}`}
                                className="p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <h4 className="font-medium text-gray-900">
                                      {materia.nombre || "Sin nombre"}
                                    </h4>
                                    {materia.descripcion && (
                                      <p className="text-sm text-gray-600">
                                        {materia.descripcion}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Badge
                                      variant="secondary"
                                      className="whitespace-nowrap"
                                    >
                                      {materia.estudiantes} estudiante
                                      {materia.estudiantes !== 1 ? "s" : ""}
                                    </Badge>
                                    <div className="flex gap-2">
                                      <Link
                                        href={`/classes/${materia.id}?bimester=${selectedBimester}&grado=${grado.grado}`}
                                      >
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8"
                                        >
                                          Ver Notas
                                        </Button>
                                      </Link>
                                      <Link
                                        href={`/upload/${materia.id}?bimester=${selectedBimester}`}
                                      >
                                        <Button size="sm" className="h-8">
                                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                                          Subir
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg">
                        No tienes grados asignados actualmente.
                      </p>
                      <p className="text-sm mt-2">
                        Contacta al administrador si crees que hay un error.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              </Tabs>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-xl font-semibold">
                {selectedStudent.nombre || selectedStudent.firstName}{" "}
                {selectedStudent.apellido || selectedStudent.lastName}
              </h3>
              <button
                onClick={closeStudentModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "info" | "grades" | "habitos" | "extraescolar")}
              className="w-full"
            >
              <div className="border-b px-6">
                <TabsList>
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="grades">Calificaciones</TabsTrigger>
                  <TabsTrigger value="habitos">
                    Hábitos y Comportamientos
                  </TabsTrigger>
                  <TabsTrigger value="extraescolar">
                    Actividades Extraescolares
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                {/* Información del Estudiante Tab */}
                <TabsContent value="info">
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex-shrink-0">
                      <div className="bg-blue-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                        <User className="h-12 w-12 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-600 mb-4">
                        {selectedStudent.dni || "Sin DNI"}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-start gap-2">
                          <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Correo</p>
                            <p className="font-medium">
                              {selectedStudent.email || "No especificado"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Teléfono</p>
                            <p className="font-medium">
                              {selectedStudent.telefono || "No especificado"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Dirección</p>
                            <p className="font-medium">
                              {selectedStudent.direccion || "No especificada"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <BookOpenCheck className="h-5 w-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Grado</p>
                            <p className="font-medium">
                              {selectedStudent.grados?.[0] || "No especificado"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t space-y-6">
                    {/* Materia que imparte el profesor */}
                    {teacherProfile?.materias?.[0] && (
                      <div>
                        <h3 className="font-semibold mb-3 text-blue-600">
                          Materia que impartes
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {teacherProfile.materias[0].materia?.nombre ||
                                "Sin nombre"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Materias extracurriculares del grado */}
                    {selectedStudent.grados?.[0] && (
                      <div>
                        <h3 className="font-semibold mb-3 text-gray-700">
                          Evaluación de Actitudes
                        </h3>
                        <div className="space-y-2">
                          {loadingMaterias ? (
                            <div className="text-sm text-gray-500">Cargando materias...</div>
                          ) : getExtraescolarMaterias(selectedStudent.grados[0]).length > 0 ? (
                            getExtraescolarMaterias(selectedStudent.grados[0]).map((materia: MateriaAsignada, idx: number) => (
                              <div
                                key={`extra-${idx}`}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                              >
                                <BookOpen className="h-4 w-4 text-gray-500" />
                                <span>{materia.materia?.nombre || 'Sin nombre'}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">No hay materias extracurriculares para este grado</div>
                          )}
                        </div>
                      </div>
                    )}

                    {!teacherProfile?.materias?.[0] &&
                      !selectedStudent.grados?.[0] && (
                        <p className="text-gray-500 text-center py-4">
                          No hay información de materias disponible
                        </p>
                      )}
                  </div>
                </TabsContent>

                {/* Calificaciones Tab */}
                <TabsContent value="grades">
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">
                        Agregar Nueva Calificación
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="materia">Materia</Label>
                          <Select
                            value={newGrade.materiaId}
                            onValueChange={(value) => setNewGrade({ ...newGrade, materiaId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar materia" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Deduplicar materias por materiaId para el dropdown */}
                              {(() => {
                                if (!teacherProfile?.materias) {
                                  return null;
                                }
                                
                                const materiasUnicas = new Map();
                                
                                teacherProfile.materias.forEach((materia) => {
                                  const materiaWithId = materia as any;
                                  const materiaIdOriginal = materiaWithId.materiaId;
                                  const materiaData = materia.materia || materia;
                                  
                                  if (materiaIdOriginal && !materiasUnicas.has(materiaIdOriginal)) {
                                    materiasUnicas.set(materiaIdOriginal, {
                                      ...materiaData,
                                      materiaId: materiaIdOriginal
                                    });
                                  }
                                });
                                
                                return Array.from(materiasUnicas.values()).map((materiaData) => {
                                  const materiaName = materiaData.nombre || materiaData.materia?.nombre || "Sin nombre";
                                  const userMateriaId = materiaData.id || materiaData.materia?.id;
                                  
                                  return (
                                    <SelectItem
                                      key={userMateriaId}
                                      value={userMateriaId}
                                    >
                                      {materiaName}
                                    </SelectItem>
                                  );
                                });
                              })()}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tipoEvaluacion">
                            Tipo de Evaluación
                          </Label>
                          <Select
                            value={newGrade.tipoEvaluacion}
                            onValueChange={(value) => setNewGrade({
                              ...newGrade,
                              tipoEvaluacion: value,
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {evaluationPeriods.map((period) => (
                                <SelectItem key={period.id} value={period.id}>
                                  {period.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tipoCalificacion">
                            Tipo de Calificación
                          </Label>
                          <Select
                            value={newGrade.tipoCalificacion}
                            onValueChange={(value) => setNewGrade({
                              ...newGrade,
                              tipoCalificacion: value as "NUMERICA" |
                                "CONCEPTUAL",
                              calificacion: undefined,
                              valorConceptual: undefined,
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NUMERICA">
                                Numérica (1-100)
                              </SelectItem>
                              <SelectItem value="CONCEPTUAL">
                                Conceptual
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {newGrade.tipoCalificacion === "NUMERICA" ? (
                          <div className="space-y-2">
                            <Label htmlFor="calificacion">Calificación</Label>
                            <Input
                              type="number"
                              id="calificacion"
                              min="1"
                              max="100"
                              value={newGrade.calificacion || ""}
                              onChange={(e) => {
                                console.log('🔍 Input calificación - valor original:', e.target.value);
                                console.log('🔍 Input calificación - parseInt:', parseInt(e.target.value));
                                console.log('🔍 Input calificación - isNaN:', isNaN(parseInt(e.target.value)));
                                setNewGrade({
                                  ...newGrade,
                                  calificacion: e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined,
                                });
                              }}
                              placeholder="1-100" />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Valor Conceptual</Label>
                            <Select
                              value={newGrade.valorConceptual}
                              onValueChange={(value) => setNewGrade({
                                ...newGrade,
                                valorConceptual: value as "DESTACA" |
                                  "AVANZA" |
                                  "NECESITA_MEJORAR" |
                                  "INSATISFACTORIO",
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar valor" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DESTACA">Destaca</SelectItem>
                                <SelectItem value="AVANZA">Avanza</SelectItem>
                                <SelectItem value="NECESITA_MEJORAR">
                                  Necesita Mejorar
                                </SelectItem>
                                <SelectItem value="INSATISFACTORIO">
                                  Insatisfactorio
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="comentario">
                            Comentario (Opcional)
                          </Label>
                          <Input
                            id="comentario"
                            value={newGrade.comentario || ""}
                            onChange={(e) => setNewGrade({
                              ...newGrade,
                              comentario: e.target.value,
                            })}
                            placeholder="Agregar un comentario" />
                        </div>

                        <div className="md:col-span-2 flex justify-end">
                          <Button
                            onClick={handleSaveGrade}
                            disabled={!newGrade.materiaId ||
                              (newGrade.tipoCalificacion === "NUMERICA" &&
                                !newGrade.calificacion) ||
                              (newGrade.tipoCalificacion === "CONCEPTUAL" &&
                                !newGrade.valorConceptual)}
                          >
                            Guardar Calificación
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">
                        Historial de Calificaciones
                      </h3>
                      {isLoadingGrades ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      ) : grades && grades.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Materia
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Valor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Fecha
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {grades.map((grade) => (
                                <tr key={grade.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {grade.materia?.nombre || "N/A"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {grade.tipoCalificacion === "NUMERICA" ? (
                                      <div className="flex items-center">
                                        <span className="text-sm font-medium">
                                          {grade.calificacion}
                                        </span>
                                        <span className="ml-1 text-xs text-gray-500">
                                          /100
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        {grade.valorConceptual ===
                                          "DESTACA" && (
                                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                          )}
                                        {grade.valorConceptual ===
                                          "INSATISFACTORIO" && (
                                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                          )}
                                        <span className="text-sm">
                                          {grade.valorConceptual === "DESTACA"
                                            ? "Destaca"
                                            : grade.valorConceptual === "AVANZA"
                                              ? "Avanza"
                                              : grade.valorConceptual ===
                                                "NECESITA_MEJORAR"
                                                ? "Necesita Mejorar"
                                                : grade.valorConceptual ===
                                                  "INSATISFACTORIO"
                                                  ? "Insatisfactorio"
                                                  : "N/A"}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {grade.fecha
                                      ? format(
                                        new Date(grade.fecha),
                                        "dd/MM/yyyy"
                                      )
                                      : "N/A"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No hay calificaciones registradas para este
                          estudiante.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Hábitos y Comportamientos Tab */}
                <TabsContent value="habitos" className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-amber-800 mb-4">
                      Evaluación de Hábitos y Comportamientos
                    </h3>

                    {loadingHabitGrades ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Cargando evaluaciones de hábitos...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Sección de Responsabilidades en el Hogar */}
                        {hogarEvaluations.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-medium text-amber-700 mb-3 flex items-center">
                              <Home className="h-4 w-4 mr-2" />
                              Responsabilidades en el Hogar
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {hogarEvaluations.map((evaluacion: any, index: number) => {
                                const currentGrade = habitEvaluationsGrades[evaluacion.evaluacionHabitoId]?.valor;
                                return (
                                  <div key={`hogar-${index}`} className="bg-white p-3 rounded border border-amber-200">
                                    <div className="flex justify-between items-center mb-2">
                                      <h5 className="font-medium">{evaluacion.nombre || 'Sin nombre'}</h5>
                                      <span className="text-xs text-gray-500">
                                        ID: {evaluacion.evaluacionHabitoId?.slice(0, 8)}...
                                      </span>
                                    </div>
                                    <div className="mb-3">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">
                                          Evaluación:
                                        </span>
                                        <Select
                                          value={currentGrade || ""}
                                          onValueChange={async (value) => {
                                            await handleSaveHabitGrade(evaluacion.evaluacionHabitoId, value as ValorConceptual);
                                          }}
                                        >
                                          <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Sin evaluar">
                                              {currentGrade ? getValorConceptualText(currentGrade as ValorConceptual) : "Seleccionar"}
                                            </SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="DESTACA">Destaca</SelectItem>
                                            <SelectItem value="AVANZA">Avanza</SelectItem>
                                            <SelectItem value="NECESITA_MEJORAR">Necesita Mejorar</SelectItem>
                                            <SelectItem value="INSATISFACTORIO">Insatisfactorio</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      {['u1', 'u2', 'u3', 'u4'].map((periodo: string) => (
                                        <div key={periodo} className="flex flex-col">
                                          <span className="text-gray-600 font-medium">{periodo.toUpperCase()}:</span>
                                          <span className="text-gray-800">
                                            {evaluacion[periodo as keyof any] || '-'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    {evaluacion.comentario && (
                                      <div className="mt-2 pt-2 border-t border-amber-200">
                                        <p className="text-sm text-gray-600">
                                          <span className="font-medium">Comentario:</span> {evaluacion.comentario}
                                        </p>
                                      </div>
                                    )}
                                    {currentGrade && (
                                      <div className="mt-2 pt-2 border-t border-amber-200">
                                        <p className="text-sm text-green-600 font-medium">
                                          Evaluación actual: {getValorConceptualText(currentGrade as ValorConceptual)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Sección de Hábitos y Comportamientos */}
                        {habitoEvaluations.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-medium text-amber-700 mb-3 flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Hábitos y Comportamientos
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {habitoEvaluations.map((evaluacion: any, index: number) => {
                                const currentGrade = habitEvaluationsGrades[evaluacion.evaluacionHabitoId]?.valor;
                                return (
                                  <div key={`habito-${index}`} className="bg-white p-3 rounded border border-amber-200">
                                    <div className="flex justify-between items-center mb-2">
                                      <h5 className="font-medium">{evaluacion.nombre || 'Sin nombre'}</h5>
                                      <span className="text-xs text-gray-500">
                                        ID: {evaluacion.evaluacionHabitoId?.slice(0, 8)}...
                                      </span>
                                    </div>
                                    <div className="mb-3">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-500">
                                          Evaluación:
                                        </span>
                                        <Select
                                          value={currentGrade || ""}
                                          onValueChange={async (value) => {
                                            await handleSaveHabitGrade(evaluacion.evaluacionHabitoId, value as ValorConceptual);
                                          }}
                                        >
                                          <SelectTrigger className="w-48">
                                            <SelectValue placeholder="Sin evaluar">
                                              {currentGrade ? getValorConceptualText(currentGrade as ValorConceptual) : "Seleccionar"}
                                            </SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="DESTACA">Destaca</SelectItem>
                                            <SelectItem value="AVANZA">Avanza</SelectItem>
                                            <SelectItem value="NECESITA_MEJORAR">Necesita Mejorar</SelectItem>
                                            <SelectItem value="INSATISFACTORIO">Insatisfactorio</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      {['u1', 'u2', 'u3', 'u4'].map((periodo: string) => (
                                        <div key={periodo} className="flex flex-col">
                                          <span className="text-gray-600 font-medium">{periodo.toUpperCase()}:</span>
                                          <span className="text-gray-800">
                                            {evaluacion[periodo as keyof any] || '-'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    {evaluacion.comentario && (
                                      <div className="mt-2 pt-2 border-t border-amber-200">
                                        <p className="text-sm text-gray-600">
                                          <span className="font-medium">Comentario:</span> {evaluacion.comentario}
                                        </p>
                                      </div>
                                    )}
                                    {currentGrade && (
                                      <div className="mt-2 pt-2 border-t border-amber-200">
                                        <p className="text-sm text-green-600 font-medium">
                                          Evaluación actual: {getValorConceptualText(currentGrade as ValorConceptual)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Mensaje si no hay evaluaciones */}
                        {hogarEvaluations.length === 0 && habitoEvaluations.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="font-medium mb-2">No hay evaluaciones de hábitos registradas para este estudiante</p>
                            <div className="text-sm text-gray-400 bg-gray-50 p-3 rounded-lg max-w-md mx-auto">
                              <p className="mb-1">Se esperaban:</p>
                              <p>• 7 evaluaciones de hábitos del hogar</p>
                              <p>• 10 evaluaciones de comportamiento</p>
                              <p className="mt-2 text-xs">Contacte al administrador para generar las evaluaciones faltantes.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Actividades Extraescolares Tab */}
                <TabsContent value="extraescolar" className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-4">
                      Evaluación de Actividades Extraescolares
                    </h3>

                    {selectedStudent?.grados?.[0] ? (
                      <div className="space-y-4">
                        {/* Sección de Evaluaciones Extraescolares del Endpoint de Hábitos */}
                        {habitGrades && habitGrades.length > 0 && (
                          <div>
                            <h4 className="font-medium text-blue-700 mb-3 flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Evaluaciones Extraescolares
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {habitGrades
                                .filter((h: any) => h.tipo === 'EXTRACURRICULAR')
                                .map((evaluacion: any, index: number) => {
                                  const currentGrade = extraescolarHabitGrades[evaluacion.evaluacionHabitoId]?.valor;
                                  return (
                                    <div key={`habit-extra-${index}`} className="bg-white p-3 rounded border border-blue-200">
                                      <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-medium">{evaluacion.nombre || 'Sin nombre'}</h5>
                                        <span className="text-xs text-gray-500">
                                          ID: {evaluacion.evaluacionHabitoId?.slice(0, 8)}...
                                        </span>
                                      </div>
                                      <div className="mb-3">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm text-gray-500">
                                            Evaluación:
                                          </span>
                                          <Select
                                            value={currentGrade || ""}
                                            onValueChange={async (value) => {
                                              await handleSaveExtraescolarHabitGrade(evaluacion.evaluacionHabitoId, value as ValorConceptual);
                                            }}
                                          >
                                            <SelectTrigger className="w-48">
                                              <SelectValue placeholder="Sin evaluar">
                                                {currentGrade ? getValorConceptualText(currentGrade as ValorConceptual) : "Seleccionar"}
                                              </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="DESTACA">Destaca</SelectItem>
                                              <SelectItem value="AVANZA">Avanza</SelectItem>
                                              <SelectItem value="NECESITA_MEJORAR">Necesita Mejorar</SelectItem>
                                              <SelectItem value="INSATISFACTORIO">Insatisfactorio</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        {['u1', 'u2', 'u3', 'u4'].map((periodo: string) => (
                                          <div key={periodo} className="flex flex-col">
                                            <span className="text-gray-600 font-medium">{periodo.toUpperCase()}:</span>
                                            <span className="text-gray-800">
                                              {evaluacion[periodo as keyof any] || '-'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                      {evaluacion.comentario && (
                                        <div className="mt-2 pt-2 border-t border-blue-200">
                                          <p className="text-sm text-gray-600">
                                            <span className="font-medium">Comentario:</span> {evaluacion.comentario}
                                          </p>
                                        </div>
                                      )}
                                      {currentGrade && (
                                        <div className="mt-2 pt-2 border-t border-blue-200">
                                          <p className="text-sm text-green-600 font-medium">
                                            Evaluación actual: {getValorConceptualText(currentGrade as ValorConceptual)}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No hay información del grado del estudiante.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs><div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={closeStudentModal}>
                Cerrar
              </Button>
              <Button asChild>
                <Link href={`/admin/students/${selectedStudent.id || ""}`}>
                  Ver perfil completo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
