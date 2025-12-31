"use client"

import { useEffect, useState, Suspense } from "react"
import { use } from "react"
import { api } from "@/lib/api"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, FileText, Loader2, AlertCircle, Plus, Pencil, X, Mail, Phone, MapPin, BookOpen, BookOpenCheck, User, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { dashboardService } from "@/lib/services/dashboardService"
import gradeService from "@/lib/services/gradeService"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { extracurricularSubjects } from "@/lib/data/academicData"
import { cn } from "@/lib/utils"

type ValorConceptual = 'EXCELENTE' | 'MUY_BUENO' | 'BUENO' | 'REGULAR' | 'EN_PROCESO';
// Add this interface at the top of the file, after the imports
interface Calificacion {
  id: string;
  calificacion: number | null;
  tipoCalificacion: 'numerica' | 'conceptual';
  valorConceptual: string | null;
  fecha: string;
  comentario: string | null;
  tipoEvaluacion: string;
  materia: {
    id: string;
    nombre: string;
    tipoMateria: string;
  };
  periodo: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  docente: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

interface MateriaInfo {
  id: string;
  nombre: string;
}

interface GradeDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

// Main page component
export default function GradeDetailsPage({ params }: GradeDetailsPageProps) {
  const { id } = use(params);
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <GradeDetailsContent id={id} />
    </Suspense>
  )
}

// Content component that handles the actual page content
function GradeDetailsContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [classInfo, setClassInfo] = useState({
    materia: 'Cargando...',
    grado: 'Cargando...',
    seccion: 'Cargando...',
    periodo: 'Cargando...',
    docente: 'Cargando...',
    mensaje: ''
  });
  const [periodoId, setPeriodoId] = useState<string>('');

  const bimester = searchParams.get('bimester') || '1';
  const grade = searchParams.get('grado') || '';
  const nivel = searchParams.get('nivel') || 'Primaria';
  const seccion = searchParams.get('seccion') || 'A';

  // Obtener el ID del período actual
  useEffect(() => {
    const fetchPeriodoActual = async () => {
      try {
        const response = await api.get('/academic-periods/current');
        if (response.data?.id) {
          setPeriodoId(response.data.id);
          if (response.data.startDate) {
            const year = new Date(response.data.startDate).getFullYear();
            setClassInfo(prev => ({
              ...prev,
              periodo: year.toString()
            }));
          }
        } else {
          throw new Error('No se pudo obtener el período actual');
        }
      } catch (error) {
        console.error('Error al obtener el período actual:', error);
        setError('No se pudo cargar el período académico actual');
        toast.error('No se pudo cargar el período académico actual');
      }
    };
    
    if (id) {
      fetchPeriodoActual();
    }
  }, [id]);

  useEffect(() => {
    // Redirigir si no está autenticado
    if (!authLoading && !user) {
      router.push('/login?session_expired=true');
      return;
    }

    const fetchGradeDetails = async () => {
      if (!periodoId) return; // No hacer nada si no tenemos el ID del período

      try {
        setLoading(true);
        setError(null);
        
        // Obtener lista de materias del docente
        const materias = await dashboardService.getMaterias();
        
        // Buscar la materia actual que se está accediendo
        const currentMateria = materias.find((m: any) => m.materiaId === id);
        
        if (!currentMateria) {
          throw new Error('No tienes permiso para acceder a esta materia o la materia no existe');
        }
        
        // Construir los parámetros exactos que espera el backend
        // El backend espera grado sin la sección, y la sección como parámetro separado
        const gradoSinSeccion = `${grade}° ${nivel}`.trim();
        const seccionActual = currentMateria.seccion || seccion;
        
        // Log para depuración
        console.log('🔍 Parámetros para la búsqueda:', {
          materiaId: id,
          grado: gradoSinSeccion,
          seccion: seccionActual,
          periodoId: periodoId,
          nivel: nivel
        });
        
        // Mostrar la materia actual para depuración
        console.log('📋 Materia actual:', {
          nombre: currentMateria.materia?.nombre,
          id: currentMateria.materiaId,
          // Usar grade en lugar de currentMateria.grado
          grado: grade,
          seccion: currentMateria.seccion
        });
        
        // Definir gradoCompleto para usarlo más adelante
        const gradoCompleto = `${grade}° ${nivel} ${seccionActual}`.trim();
        
        try {
          // Llamar al servicio con los parámetros correctos
          // El servicio ya maneja los parámetros opcionales internamente
          const gradesResponse = await gradeService.getByMateriaGradoPeriodo(
            id,              // materiaId
            `${gradoSinSeccion} ${seccionActual}`, // grado completo con sección
            periodoId,       // periodoId
            nivel           // nivel (opcional)
          );
          
          // Log de la respuesta en crudo
          console.log('📥 Respuesta cruda de la API:', gradesResponse);
          
          console.log('📥 Respuesta de la API:', {
            response: gradesResponse,
            length: gradesResponse?.length,
            isEmpty: !gradesResponse || gradesResponse.length === 0
          });
          
          // Actualizar la información de la clase
          const classInfoUpdate = {
            materia: currentMateria.materia?.nombre || 'Materia no disponible',
            grado: grade,
            seccion: currentMateria.seccion || seccion,
            periodo: currentMateria.periodo || 'Período no disponible',
            docente: user?.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Docente no disponible',
            mensaje: !gradesResponse || gradesResponse.length === 0 ? 
              `No se encontraron estudiantes en ${gradoSinSeccion} ${seccionActual}`.trim() : ''
          };
          
          console.log('🔄 Actualizando información de la clase:', classInfoUpdate);
          setClassInfo(classInfoUpdate);
          setGrades(gradesResponse || []);
          
        } catch (err: any) {
          console.error('Error al cargar las calificaciones:', err);
          setError('No se pudieron cargar las calificaciones. Por favor, inténtalo de nuevo.');
          toast.error('Error al cargar las calificaciones');
        }
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Ocurrió un error inesperado');
        toast.error(err.message || 'Error al cargar la información de la clase');
      } finally {
        setLoading(false);
      }
    };

    if (id && !authLoading && user && periodoId) {
      fetchGradeDetails();
    }
  }, [id, grade, nivel, seccion, user, authLoading, router, periodoId]);

  const handleDownloadReport = () => {
    // Implementar lógica de descarga
    toast.info('Generando reporte de calificaciones...')
  }

  // State for student modal and grades
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"info" | "grades" | "extraescolar">("grades");
  const [extraescolarGrades, setExtraescolarGrades] = useState<Record<string, { id: string; valor: ValorConceptual; materiaId: string }>>({});
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  
  // State for editing grades
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [gradeValue, setGradeValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (grade: any) => {
    setEditingGrade(grade);
    setGradeValue(grade.calificacion?.toString() || '');
  };

  const cancelEditing = () => {
    setEditingGrade(null);
    setGradeValue('');
  };

  const saveGrade = async () => {
    if (!editingGrade || !gradeValue) return;
    
    const numericGrade = parseFloat(gradeValue);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      toast.error('La calificación debe ser un número entre 0 y 100');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the grade data based on whether we're updating or creating
      const gradeData = {
        estudianteId: selectedStudent.id,
        materiaId: editingGrade.materiaId,
        periodoId: editingGrade.periodoId || periodoId,
        calificacion: numericGrade,
        tipoCalificacion: 'NUMERICA' as const,
        tipoEvaluacion: editingGrade.tipoEvaluacion || '94b881f5-9580-4569-b700-6e66768b6e40', // Default from the response
        comentario: editingGrade.comentario // Keep the existing comment if not changed
      };

      let updatedGrade;
      if (editingGrade.id) {
        // Update only the grade value for existing grades
        const updateData: any = {
          calificacion: numericGrade
        };
        
        // Only include comentario in the update if it was explicitly changed
        if (editingGrade.comentario !== undefined) {
          updateData.comentario = editingGrade.comentario;
        }
        
        updatedGrade = await gradeService.update(editingGrade.id, updateData);
      } else {
        // Create new grade
        updatedGrade = await gradeService.create({
          ...gradeData,
          userMateriaId: editingGrade.materiaId // Use materiaId as userMateriaId if not available
        });
      }

      // Update the UI
      setStudentGrades(prev => 
        prev.map(g => 
          g.id === updatedGrade.id ? updatedGrade : g
        )
      );
      
      toast.success('Calificación actualizada correctamente');
      setEditingGrade(null);
    } catch (error) {
      console.error('Error al guardar la calificación:', error);
      toast.error('Error al guardar la calificación');
    } finally {
      setIsSaving(false);
    }
  };

  const closeStudentModal = () => {
    setSelectedStudent(null);
    setEditingGrade(null);
    setActiveTab("grades");
    setExtraescolarGrades({});
  };

  const loadStudentGrades = async (studentId: string) => {
    if (!studentId) return;
    
    setIsLoadingGrades(true);
    try {
      // Use getByStudent instead of getByEstudiante
      const response = await gradeService.getByStudent(studentId, periodoId);
      setStudentGrades(response);
      
      // Initialize extracurricular grades
      const initialExtraescolarGrades: Record<string, { id: string; valor: ValorConceptual; materiaId: string }> = {};
      
      if (selectedStudent?.grados?.[0] && selectedStudent.grados[0] in extracurricularSubjects) {
        const actividades = (extracurricularSubjects as any)[selectedStudent.grados[0]] as string[];
        actividades.forEach(actividad => {
          initialExtraescolarGrades[actividad] = {
            id: '',
            valor: 'BUENO',
            materiaId: ''
          };
        });
      }
      
      setExtraescolarGrades(initialExtraescolarGrades);
    } catch (error) {
      console.error('Error loading student grades:', error);
      toast.error('Error al cargar las calificaciones del estudiante');
    } finally {
      setIsLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (selectedStudent?.id) {
      loadStudentGrades(selectedStudent.id);
    }
  }, [selectedStudent]);

  const handleEditGrade = async (grade: any) => {
    if (!user) {
      router.push('/login?session_expired=true');
      return;
    }
    
    if (grade?.estudiante?.id) {
      try {
        setLoading(true);
        
        // Fetch complete student data including grades
        const studentData = await dashboardService.getEstudianteConCalificaciones(grade.estudiante.id);
        
        // Ensure we have all required student fields
        const studentWithAllFields = {
          ...studentData,
          id: grade.estudiante.id,
          nombre: grade.estudiante.nombre || studentData.nombre || '',
          apellido: grade.estudiante.apellido || studentData.apellido || '',
          email: studentData.email || grade.estudiante.email || '',
          telefono: studentData.telefono || grade.estudiante.telefono || '',
          direccion: studentData.direccion || grade.estudiante.direccion || '',
          dni: studentData.dni || grade.estudiante.dni || '',
          grados: studentData.grados || [grade.grado || '']
        };
        
        // Set the selected student
        setSelectedStudent(studentWithAllFields);
        
        // Load the student's grades
        await loadStudentGrades(grade.estudiante.id);
        
        // Set active tab to grades
        setActiveTab("grades");
        
      } catch (error) {
        console.error('Error fetching student details:', error);
        toast.error('Error al cargar los detalles del estudiante');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando calificaciones...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center space-y-4 h-64">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-medium">Error al cargar las calificaciones</p>
          <p className="text-muted-foreground text-center max-w-md">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Volver al dashboard</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Calificaciones</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {classInfo.materia} • {classInfo.grado} {classInfo.seccion} • {classInfo.periodo}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </div>

      {/* Información de la clase */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Materia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classInfo.materia}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Grado y Sección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classInfo.grado} {classInfo.seccion}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bimestre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-base px-3 py-1">
                {bimester}° Bimestre
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Docente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{classInfo.docente}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de calificaciones */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Registro de Calificaciones</CardTitle>
              <CardDescription>
                Lista de estudiantes y sus calificaciones del {bimester}° bimestre
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Agregar Calificación
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <FileText className="h-4 w-4 mr-1" />
                Ver Historial
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Estudiante</TableHead>
                  <TableHead className="w-1/6 text-center">Calificación</TableHead>
                  <TableHead className="w-1/3">Comentarios</TableHead>
                  <TableHead className="w-1/6 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.length > 0 ? (
                  grades.map((grade, index) => (
                    <TableRow key={grade.estudiante?.id || index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-sm font-medium text-muted-foreground">
                              {grade.estudiante?.nombre?.charAt(0)}{grade.estudiante?.apellido?.charAt(0) || ''}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {grade.estudiante?.nombre} {grade.estudiante?.apellido}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {grade.estudiante?.dni || 'Sin DNI'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {grade.calificaciones?.[0]?.calificacion ? (
                          <Badge 
                            variant="outline" 
                            className={`text-base ${grade.calificaciones[0].calificacion <= 60 ? 'bg-red-50 border-red-200 text-red-700' : ''}`}
                          >
                            {grade.calificaciones[0].calificacion.toFixed(1)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {grade.calificaciones?.[0]?.comentario || 'Sin comentarios'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditGrade(grade)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 py-6">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No hay calificaciones registradas para este período.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Calificación
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Resumen */}
          {grades.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-muted/50 rounded-md">
              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{grades.length}</span> estudiantes
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Promedio del grupo:</span>{' '}
                  <span className="font-semibold">
                    {(grades.reduce((acc, curr) => acc + (curr.promedio || 0), 0) / grades.length).toFixed(1)}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="h-4 w-4 mr-1" />
                  Descargar todo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedStudent.nombre || selectedStudent.firstName} {selectedStudent.apellido || selectedStudent.lastName}
                </h2>
                <button 
                  onClick={closeStudentModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Información</TabsTrigger>
                  <TabsTrigger value="grades">Calificaciones</TabsTrigger>
                  <TabsTrigger value="extraescolar">Actividades</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">Información del Estudiante</h3>
                          <p className="text-sm text-gray-500">
                            {selectedStudent.dni || 'Sin DNI'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Correo</p>
                            <p className="font-medium">
                              {selectedStudent.email || 'No especificado'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Teléfono</p>
                            <p className="font-medium">
                              {selectedStudent.telefono || 'No especificado'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Dirección</p>
                            <p className="font-medium">
                              {selectedStudent.direccion || 'No especificada'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <BookOpenCheck className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Grado</p>
                            <p className="font-medium">
                              {selectedStudent.grados?.[0] || 'No especificado'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Materias Inscritas</h3>
                      {selectedStudent.materias?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedStudent.materias.map((materia: any) => (
                            <div key={materia.id} className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              <span>{materia.nombre}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No hay materias registradas</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="grades" className="mt-6">
                  {isLoadingGrades ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : studentGrades.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Materia
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Calificación
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Comentario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {studentGrades
                            .filter((grade: any) => grade.materiaId === id)
                            .map((grade: any) => (
                              <tr key={grade.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {grade.materia?.nombre || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {editingGrade?.id === grade.id ? (
                                    <div className="flex items-center space-x-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={gradeValue}
                                        onChange={(e) => setGradeValue(e.target.value)}
                                        className="w-24"
                                        disabled={isSaving}
                                      />
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={saveGrade}
                                        disabled={isSaving}
                                      >
                                        {isSaving ? 'Guardando...' : 'Guardar'}
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={cancelEditing}
                                        disabled={isSaving}
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      {grade.calificacion ? (
                                        <Badge 
                                          variant="outline"
                                          className={cn(
                                            "text-base cursor-pointer hover:bg-gray-50",
                                            grade.calificacion <= 60 ? 'bg-red-50 border-red-200 text-red-700' : ''
                                          )}
                                          onClick={() => startEditing(grade)}
                                        >
                                          {grade.calificacion.toFixed(1)}
                                        </Badge>
                                      ) : (
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={() => startEditing(grade)}
                                        >
                                          Agregar nota
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {grade.comentario || 'Sin comentarios'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {grade.fecha ? new Date(grade.fecha).toLocaleDateString() : 'N/A'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No hay calificaciones registradas para este estudiante.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="extraescolar" className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Actividades Extraescolares</h3>
                  {selectedStudent.grados?.[0] && selectedStudent.grados[0] in extracurricularSubjects ? (
                    <div className="space-y-4">
                      {((extracurricularSubjects as any)[selectedStudent.grados[0]] as string[]).map((actividad: string, index: number) => {
                        const gradeInfo = extraescolarGrades[actividad];
                        const currentGrade = gradeInfo?.valor || 'BUENO';
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="font-medium">{actividad}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {currentGrade === 'EXCELENTE' ? 'Excelente' :
                                 currentGrade === 'MUY_BUENO' ? 'Muy Bueno' :
                                 currentGrade === 'BUENO' ? 'Bueno' :
                                 currentGrade === 'REGULAR' ? 'Regular' : 'En Proceso'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay actividades extraescolares definidas para este grado.</p>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 pt-6 border-t flex justify-end space-x-3">
                <Button variant="outline" onClick={closeStudentModal}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
