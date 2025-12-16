"use client";

import {
  useState,
  useEffect,
  useMemo,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { dashboardService } from "@/lib/services/dashboardService";
import type { Estudiante, Materia } from "@/lib/services/dashboardService";

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
import { extracurricularSubjects } from "@/lib/data/academicData";
import Link from "next/link";
import {
  type GradoConMaterias,
  type Materia as ServiceMateria,
  type MateriaBase,
  type Bimestre,
  type TeacherProfile,
} from "@/lib/services/dashboardService";

// Definir un tipo local para el dashboard
type DashboardAcademicPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: "active" | "inactive" | "completed" | "upcoming";
  description?: string;
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
  // Estado para la pestaña activa
  const [activeMainTab, setActiveMainTab] = useState<"grados" | "calificaciones">("grados");
  const [selectedBimester, setSelectedBimester] = useState("1");

  // Estado para las calificaciones
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
        setStudents([]);
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
        const estudiantes = await dashboardService.getEstudiantesPorGrado({
          grado: parseInt(grado),
          nivel: nivel || undefined,
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
    console.log('Iniciando handleEditGrade con:', { studentId, currentGrade, materiaId });
    
    // Buscar la calificación existente
    const gradeToEdit = classGrades.find(
      g => g.estudianteId === studentId && 
           g.materiaId === materiaId
    );

    console.log('Calificación encontrada para editar:', gradeToEdit);

    if (gradeToEdit) {
      console.log('Configurando formulario para editar calificación existente:', {
        materiaId: gradeToEdit.materiaId,
        tipoCalificacion: gradeToEdit.tipoCalificacion,
        tipoEvaluacion: gradeToEdit.tipoEvaluacion,
        calificacion: gradeToEdit.calificacion,
        valorConceptual: gradeToEdit.valorConceptual,
        comentario: gradeToEdit.comentario
      });
      
      setNewGrade({
        materiaId: gradeToEdit.materiaId,
        tipoCalificacion: gradeToEdit.tipoCalificacion,
        tipoEvaluacion: gradeToEdit.tipoEvaluacion,
        calificacion: gradeToEdit.calificacion || undefined,
        valorConceptual: gradeToEdit.valorConceptual || undefined,
        comentario: gradeToEdit.comentario || "",
      });
      setEditingId(studentId);
      console.log('Modo edición activado para estudiante:', studentId);
    } else {
      console.log('No se encontró calificación existente, preparando para crear una nueva');
      // Si no existe la calificación, preparar para crear una nueva
      setNewGrade(prev => {
        const newState = {
          ...prev,
          materiaId,
          calificacion: currentGrade || undefined,
        };
        console.log('Nuevo estado para calificación:', newState);
        return newState;
      });
      setEditingId(studentId);
      console.log('Modo creación activado para estudiante:', studentId);
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

      // Aquí iría la lógica para guardar la calificación en la API
      console.log(`Guardando calificación ${gradeValue} para el estudiante ${studentId}`);

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Actualizar la interfaz
      setEditingId(null);
      // En una implementación real, actualizaríamos el estado con la respuesta de la API
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
      const period = await dashboardService.getCurrentAcademicPeriod();
      if (!period) return null;
      return period;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const [expandedGrados, setExpandedGrados] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "grades" | "extraescolar">("info"); // 'info', 'grades', or 'extraescolar'
  const [extraescolarGrades, setExtraescolarGrades] = useState<Record<string, { id: string; valor: ValorConceptual; materiaId: string }>>({});
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

  // Load grades for the selected student
  const loadStudentGrades = async (studentId: string, periodoId: string) => {
    console.group('=== INICIO loadStudentGrades ===');
    console.log('Parámetros recibidos:', { studentId, periodoId });
    
    if (!studentId || !periodoId) {
      console.error('Faltan parámetros requeridos:', { studentId, periodoId });
      console.groupEnd();
      return;
    }

    setIsLoadingGrades(true);
    try {
      console.log('Obteniendo calificaciones del estudiante...');
      const studentData = await dashboardService.getEstudianteConCalificaciones(studentId);
      const allGrades = studentData.calificaciones || [];
      
      console.log('Todas las calificaciones recibidas:', allGrades);
      console.log('Filtrando por periodoId:', periodoId);

      // Filter grades by the current period
      const studentGrades = allGrades.filter(g => {
        const matches = g.periodoId === periodoId;
        console.log(`Calificación ID ${g.id} - periodoId: ${g.periodoId} - ¿Coincide? ${matches}`);
        return matches;
      });

      console.log('Calificaciones filtradas por período:', studentGrades);

      // If we get here, the request was successful but might be empty
      if (!studentGrades || studentGrades.length === 0) {
        console.log('No se encontraron calificaciones para el período seleccionado');
        setGrades([]);
        setExtraescolarGrades({});
        console.groupEnd();
        return;
      }

      // Map the response to match CalificacionResponse type
      console.log('Mapeando calificaciones...');
      const mappedGrades = studentGrades.map((grade: any) => {
        const mappedGrade = {
          ...grade,
          estudianteId: grade.estudiante?.id || studentId,
          docenteId: grade.docente?.id || user?.id || "",
          estudiante: {
            id: grade.estudiante?.id || studentId,
            nombre:
              grade.estudiante?.nombre ||
              selectedStudent?.nombre ||
              selectedStudent?.firstName ||
              "",
            apellido:
              grade.estudiante?.apellido ||
              selectedStudent?.apellido ||
              selectedStudent?.lastName ||
              "",
          },
          materia: {
            id: grade.materia?.id || "",
            nombre: grade.materia?.nombre || "Materia no especificada",
          },
          periodo: {
            id: grade.periodo?.id || periodoId,
            nombre: grade.periodo?.nombre || "Período no especificado",
          },
          docente: {
            id: grade.docente?.id || user?.id || "",
            nombre:
              grade.docente?.nombre || user?.name || "Docente no especificado",
          },
          fecha: grade.fecha || new Date().toISOString(),
          createdAt: grade.createdAt || new Date().toISOString(),
          updatedAt: grade.updatedAt || new Date().toISOString(),
        };
        
        console.log(`Mapeada calificación ID ${grade.id}:`, {
          materia: mappedGrade.materia.nombre,
          calificacion: mappedGrade.calificacion,
          periodo: mappedGrade.periodo.nombre,
          estudiante: `${mappedGrade.estudiante.nombre} ${mappedGrade.estudiante.apellido}`
        });
        
        return mappedGrade;
      });

      // Get the student's grade name to identify extracurricular subjects
      const studentGradeName = selectedStudent?.grados?.[0];
      console.log('Grado del estudiante:', studentGradeName);
      
      const extraSubjectsList = studentGradeName && studentGradeName in extracurricularSubjects
        ? (extracurricularSubjects as any)[studentGradeName]
        : [];
      
      console.log('Materias extraescolares para este grado:', extraSubjectsList);

      // Separate regular and extracurricular grades
      const regularGrades: CalificacionResponse[] = [];
      const extraGrades: Record<string, { id: string; valor: ValorConceptual; materiaId: string }> = {};

      console.log('Separando calificaciones regulares y extraescolares...');
      mappedGrades.forEach((g: any) => {
        const isExtra = g.esExtraescolar || (g.materia?.nombre && extraSubjectsList.includes(g.materia.nombre));
        console.log(`Procesando calificación ID ${g.id} (${g.materia?.nombre}):`, {
          esExtraescolar: g.esExtraescolar,
          nombreMateria: g.materia?.nombre,
          esExtraescolarPorLista: g.materia?.nombre && extraSubjectsList.includes(g.materia.nombre),
          esExtra: isExtra
        });

        if (isExtra && g.materia?.nombre) {
          console.log(`Marcando como extraescolar: ${g.materia.nombre}`);
          extraGrades[g.materia.nombre] = {
            id: g.id,
            valor: g.valorConceptual || "",
            materiaId: g.materia.id
          };
        } else {
          console.log(`Agregando a calificaciones regulares: ${g.materia?.nombre || 'sin nombre'}`);
          regularGrades.push(g);
        }
      });

      console.log('Actualizando estado con las calificaciones cargadas');
      console.log('Total de calificaciones regulares:', regularGrades.length);
      console.log('Total de calificaciones extraescolares:', Object.keys(extraGrades).length);
      
      setGrades(regularGrades);
      setExtraescolarGrades(extraGrades);
      
      console.log('Estado actualizado correctamente');
      console.groupEnd();
    } catch (error) {
      console.error("Error al cargar calificaciones del estudiante:", error);
      toast.error("No se pudieron cargar las calificaciones");
    } finally {
      setIsLoadingGrades(false);
    }
  };

  // Effect to load grades and evaluation periods when student or period changes
  useEffect(() => {
    if (selectedStudent && currentPeriod) {
      loadStudentGrades(selectedStudent.id, currentPeriod.id);
      loadEvaluationPeriods(currentPeriod.id);
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
        console.log(
          "❌ No hay ID de período, no se pueden cargar los bimestres"
        );
        return [];
      }
      console.log(
        "🔍 Solicitando bimestres para el período:",
        currentPeriod.id
      );
      try {
        const data = await dashboardService.getBimestres(currentPeriod.id);
        console.log("📊 Bimestres recibidos del backend:", data);
        return data;
      } catch (error) {
        console.error("❌ Error al obtener los bimestres:", error);
        return [];
      }
    },
    enabled: !!currentPeriod?.id, // Solo ejecutar si hay un ID de período
    staleTime: 5 * 60 * 1000, // 5 minutos de caché
  });

  // Depuración: Mostrar el estado actual de los datos
  useEffect(() => {
    console.log("📌 Estado actual de los datos:");
    console.log("- currentPeriod:", currentPeriod);
    console.log("- bimestres:", bimestres);
    console.log("- isLoadingBimestres:", isLoadingBimestres);
    console.log("- bimestresError:", bimestresError);
  }, [currentPeriod, bimestres, isLoadingBimestres, bimestresError]);

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

  // Mostrar todos los grados disponibles
  const [filteredGrados, setFilteredGrados] = useState<GradoConMaterias[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Estudiante[]>([]);



  useEffect(() => {
    const updateFilteredGrados = () => {
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
        setFilteredGrados([defaultGrado]);
      } else {
        setFilteredGrados(grados as unknown as GradoConMaterias[]);
      }
    };

    updateFilteredGrados();
  }, [grados, teacherProfile]);

  // Filter students based on search term
  useEffect(() => {
    if (!students) {
      setFilteredStudents([]);
      return;
    }

    if (!searchTerm) {
      setFilteredStudents(students);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.nombre?.toLowerCase().includes(term) ||
        student.apellido?.toLowerCase().includes(term) ||
        student.dni?.includes(term)
    );
    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  const [classGrades, setClassGrades] = useState<CalificacionResponse[]>([]);

  useEffect(() => {
    if (filteredGrados.length > 0) {
      // Auto-expand the first grade if it has students
      const firstGradoId = "grado-0";
      setExpandedGrados(prev => ({
        ...prev,
        [firstGradoId]: true
      }));
    }
  }, [filteredGrados]);

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
            console.log(`📡 Fetching grades for materia: ${materia.id}, grado: ${grado}, nivel: ${nivel}, periodo: ${currentPeriod.id}`);
            
            // Use the new endpoint to get grades by materia, grade, and period
            const response = await gradeService.getByMateriaGradoPeriodo(
              materia.id,    // materiaId
              grado,         // grado (e.g., "1", "2")
              currentPeriod.id, // periodoId
              nivel          // nivel (e.g., "Básico")
            );

            console.log('📊 Grades received from API:', response);
            
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

            console.log('🔄 Transformed grades:', transformedGrades);
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
  }, [selectedGrade, selectedBimester, currentPeriod, filteredGrados, bimestres]);

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
    
    console.log('Datos iniciales:', {
      selectedStudentId: selectedStudent?.id,
      editingId,
      resolvedStudentId: studentId,
      currentPeriodId: currentPeriod?.id,
      newGrade,
      classGrades: classGrades.map(g => ({ id: g.id, estudianteId: g.estudianteId, materiaId: g.materiaId, calificacion: g.calificacion }))
    });

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
          grade => grade.estudianteId === editingId && 
                  grade.materiaId === newGrade.materiaId
        );

        console.log('Calificación encontrada para actualizar:', gradeToUpdate);

        if (gradeToUpdate) {
          console.log('=== PREPARANDO ACTUALIZACIÓN ===');
          console.log('ID de la calificación a actualizar:', gradeToUpdate.id);
          console.log('Nuevos valores a guardar:', {
            tipoCalificacion: newGrade.tipoCalificacion,
            tipoEvaluacion: newGrade.tipoEvaluacion,
            calificacion: newGrade.calificacion,
            valorConceptual: newGrade.valorConceptual,
            comentario: newGrade.comentario,
            materiaId: newGrade.materiaId,
            periodoId: currentPeriod.id
          });

          try {
            console.log('Llamando a gradeService.update...');
            const updateData: UpdateCalificacionRequest = {
              tipoCalificacion: newGrade.tipoCalificacion,
              tipoEvaluacion: newGrade.tipoEvaluacion,
              calificacion: newGrade.calificacion,
              valorConceptual: newGrade.valorConceptual as ValorConceptual,
              comentario: newGrade.comentario,
              materiaId: newGrade.materiaId,
              periodoId: currentPeriod.id
            };
            console.log('Datos para actualizar:', updateData);
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
        
        const gradeData: CreateCalificacionRequest = {
          userMateriaId: newGrade.materiaId,
          estudianteId: selectedStudent.id,
          periodoId: currentPeriod.id,
          tipoCalificacion: newGrade.tipoCalificacion,
          tipoEvaluacion: newGrade.tipoEvaluacion,
          calificacion: newGrade.calificacion,
          valorConceptual: newGrade.valorConceptual as ValorConceptual,
          comentario: newGrade.comentario,
          esExtraescolar: false,
        };

        const newGradeResponse = await gradeService.create(gradeData);
        
        // Agregar la nueva calificación al estado local
        setClassGrades(prevGrades => [...prevGrades, newGradeResponse]);
        
        toast.success("Calificación guardada correctamente");
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
            <Tabs value={activeMainTab} onValueChange={(value) => setActiveMainTab(value as "grados" | "calificaciones")} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grados">Grados</TabsTrigger>
                <TabsTrigger value="calificaciones">Calificaciones</TabsTrigger>
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
                                        href={`/grades/${materia.id}?bimester=${selectedBimester}&grado=${grado.grado}`}
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

              <TabsContent value="calificaciones" className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h2 className="text-2xl font-semibold mb-6">Gestión de Calificaciones</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-medium mb-2">Seleccionar Grado</h3>
                      <Select onValueChange={setSelectedGrade} value={selectedGrade || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un grado" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredGrados.map((grado) => (
                            <SelectItem
                              key={`select-${grado.grado}-${grado.nivel}-${grado.seccion}`}
                              value={`${grado.grado}|${grado.nivel}|${grado.seccion || ''}`}
                            >
                              {isNaN(Number(grado.grado))
                                ? `${grado.grado} ${grado.seccion ? `- ${grado.seccion}` : ''}`
                                : `${grado.grado}° ${grado.nivel} ${grado.seccion ? `- ${grado.seccion}` : ''}`
                              }
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Bimestre</h3>
                      <Select value={selectedBimester} onValueChange={setSelectedBimester}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un bimestre" />
                        </SelectTrigger>
                        <SelectContent>
                          {bimestres.length > 0 ? (
                            bimestres.map((bimestre) => (
                              <SelectItem key={bimestre.id} value={bimestre.numero.toString()}>
                                {bimestre.nombre}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-gray-500 text-center">
                              No hay bimestres disponibles
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isLoadingStudents ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : errorLoadingStudents ? (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            {errorLoadingStudents}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : selectedGrade ? (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Lista de Estudiantes</h3>
                        <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Buscar estudiante..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Estudiante</TableHead>
                              <TableHead>DNI</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Grado/Sección</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>Calificación</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>

                            {filteredStudents.length > 0 ? (
                              filteredStudents.map((estudiante) => {
                                const grade = getCurrentGrade(estudiante);
                                const isEditing = editingId === estudiante.id;
                                const gradoInfo = estudiante.grados?.[0] || 'N/A';

                                return (
                                  <TableRow key={estudiante.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex flex-col">
                                        <span>{`${estudiante.nombre} ${estudiante.apellido}`}</span>
                                        {estudiante.telefono && (
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {estudiante.telefono}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {estudiante.dni || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      {estudiante.email || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span>{gradoInfo}</span>
                                        {estudiante.secciones?.length > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            Secciones: {estudiante.secciones.join(', ')}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={estudiante.activo ? 'default' : 'destructive'}>
                                        {estudiante.activo ? 'Activo' : 'Inactivo'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="w-20"
                                        />
                                      ) : (
                                        <span className={cn(
                                          'font-medium',
                                          typeof grade === 'number' && grade < 60 ? 'text-red-500' : 'text-green-600'
                                        )}>
                                          {typeof grade === 'number' ? `${grade}%` : (grade || 'N/A')}
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <div className="flex gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleSaveGrade(e);
                                            }}
                                          >
                                            <Check className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingId(null)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            // Find the current grade to get the materiaId
                                            const currentGrade = classGrades.find(g => g.estudianteId === estudiante.id);
                                            handleEditGrade(
                                              estudiante.id, 
                                              typeof grade === 'number' ? grade : null,
                                              currentGrade?.materiaId || ''
                                            );
                                          }}
                                          title="Editar calificación"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                  No hay estudiantes en este grado
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-blue-700">Selecciona un grado para ver los estudiantes</p>
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
              onValueChange={(value) => setActiveTab(value as "info" | "grades" | "extraescolar")}
              className="w-full"
            >
              <div className="border-b px-6">
                <TabsList>
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="grades">Calificaciones</TabsTrigger>
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
                          {(selectedStudent.grados[0] in extracurricularSubjects
                            ? extracurricularSubjects[selectedStudent
                              .grados[0] as keyof typeof extracurricularSubjects]
                            : []
                          ).map((materia: string, idx: number) => (
                            <div
                              key={`extra-${idx}`}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                            >
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <span>{materia}</span>
                            </div>
                          ))}
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
                              {teacherProfile?.materias?.map((materia) => {
                                const materiaName = materia.materia?.nombre || "Sin nombre";
                                return (
                                  <SelectItem
                                    key={materia.id}
                                    value={materia.id}
                                  >
                                    {materiaName}
                                  </SelectItem>
                                );
                              })}
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
                              onChange={(e) => setNewGrade({
                                ...newGrade,
                                calificacion: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })}
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
                                  Evaluación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Tipo
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
                                    <div className="text-sm text-gray-900">
                                      {grade.tipoEvaluacion === "PARCIAL_1"
                                        ? "Parcial 1"
                                        : grade.tipoEvaluacion === "PARCIAL_2"
                                          ? "Parcial 2"
                                          : grade.tipoEvaluacion ===
                                            "RECUPERATORIO"
                                            ? "Recuperatorio"
                                            : grade.tipoEvaluacion === "FINAL"
                                              ? "Examen Final"
                                              : grade.tipoEvaluacion}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${grade.tipoCalificacion === "NUMERICA"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"}`}
                                    >
                                      {grade.tipoCalificacion === "NUMERICA"
                                        ? "Numérica"
                                        : "Conceptual"}
                                    </span>
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

                {/* Actividades Extraescolares Tab */}
                <TabsContent value="extraescolar" className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-4">
                      Evaluación de Actividades Extraescolares
                    </h3>

                    {selectedStudent?.grados?.[0] &&
                      selectedStudent.grados[0] in extracurricularSubjects ? (
                      <div className="space-y-4">
                        {(
                          (extracurricularSubjects as any)[selectedStudent.grados[0]] as string[]
                        ).map((actividad: string, index: number) => {
                          const gradeInfo = extraescolarGrades[actividad];
                          const currentGrade = gradeInfo?.valor || "";

                          return (
                            <div
                              key={`extra-${index}`}
                              className="bg-white p-4 rounded-lg border"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">{actividad}</h4>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">
                                    Evaluación:
                                  </span>
                                  <Select
                                    disabled={!!currentGrade}
                                    value={currentGrade || ""}
                                    onValueChange={async (value) => {
                                      try {
                                        if (!selectedStudent?.id || !currentPeriod?.id) {
                                          throw new Error("Faltan datos del estudiante o período");
                                        }

                                        // Update local state immediately for better UX
                                        setExtraescolarGrades(prev => ({
                                          ...prev,
                                          [actividad]: {
                                            id: gradeInfo?.id || "", // Temporary ID if new
                                            valor: value as ValorConceptual,
                                            materiaId: gradeInfo?.materiaId || ""
                                          },
                                        }));

                                        try {
                                          if (gradeInfo?.id) {
                                            await gradeService.updateExtracurricularGrade(
                                              gradeInfo.id,
                                              {
                                                valorConceptual: value as ValorConceptual,
                                                comentario: "Evaluación de actividad extraescolar"
                                              }
                                            );
                                          } else {
                                            // Generate a fake ID for the new activity if needed, or let backend handle it
                                            // The backend seems to expect a materiaId or creates one
                                            const activityId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                                              /[xy]/g,
                                              function (c) {
                                                const r = Math.random() * 16 | 0;
                                                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                                                return v.toString(16);
                                              }
                                            );

                                            await gradeService.createExtracurricularGrade({
                                              estudianteId: selectedStudent.id,
                                              materiaId: activityId,
                                              periodoId: currentPeriod.id,
                                              valorConceptual: value as ValorConceptual,
                                              comentario: "Evaluación de actividad extraescolar",
                                              nombreMateria: actividad
                                            });
                                          }

                                          // Refresh grades to ensure we have the latest data
                                          await loadStudentGrades(
                                            selectedStudent.id,
                                            currentPeriod.id
                                          );
                                          toast.success("Evaluación guardada correctamente");
                                        } catch (error) {
                                          // Revert local state on error
                                          setExtraescolarGrades(prev => {
                                            const newState = { ...prev };
                                            if (gradeInfo?.valor) {
                                              newState[actividad] = gradeInfo;
                                            } else {
                                              delete newState[actividad];
                                            }
                                            return newState;
                                          });
                                          throw error;
                                        }
                                      } catch (error) {
                                        console.error("Error al guardar la evaluación:", error);
                                        toast.error("Error al guardar la evaluación");
                                      }
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

                              {currentGrade && (
                                <div className="text-sm text-gray-600 mt-2">
                                  <p>
                                    Evaluación actual:{" "}
                                    {getValorConceptualText(currentGrade as ValorConceptual)}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No hay actividades extracurriculares definidas para este grado.
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
