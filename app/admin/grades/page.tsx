"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Settings, 
  BarChart3, 
  UserPlus, 
  School, 
  FileText, 
  Plus, 
  Loader2, 
  Calendar,
  ArrowLeft,
  Search,
  Phone,
  Mail,
  MapPin,
  BookOpenCheck,
  AlertCircle,
  X,
  Check,
  Pencil,
  Download,
  Edit,
  Trash2,
  Eye,
  Filter,
  User
} from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Importar servicios
import { dashboardService } from "@/lib/services/dashboardService"
import gradeService, { CalificacionPorEstudiante } from "@/lib/services/gradeService"
import DownloadGradeReportButton from "@/components/DownloadGradeReportButton"

// Interfaces
interface Estudiante {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  grados?: string[];
  secciones?: string[];
}

interface Bimestre {
  id: string;
  numero: number;
  nombre: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  progreso: number;
  isCurrent: boolean;
  status: string;
  descripcion: string;
}

interface GradoInfo {
  grado: string;
  nivel: string;
  seccion?: string;
}

type ValorConceptual = "DESTACA" | "AVANZA" | "NECESITA_MEJORAR" | "INSATISFACTORIO";

export default function AdminGradesPage() {
  const { token } = useAuth()
  
  // Estados principales
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<GradoInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [errorLoadingStudents, setErrorLoadingStudents] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  
  // Estados adicionales
  const [teacherProfile, setTeacherProfile] = useState<any>(null)
  const [currentPeriod, setCurrentPeriod] = useState<any>(null)
  const [bimestres, setBimestres] = useState<Bimestre[]>([])
  const [selectedBimester, setSelectedBimester] = useState("1")
  const [filteredGrados, setFilteredGrados] = useState<GradoInfo[]>([])
  const [classGrades, setClassGrades] = useState<CalificacionPorEstudiante[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null)
  const [activeTab, setActiveTab] = useState<"info" | "grades" | "habitos">("info")
  const [grades, setGrades] = useState<CalificacionPorEstudiante[]>([])

  // Estados adicionales para el modal completo
  const [materias, setMaterias] = useState<any[]>([])
  const [habitGrades, setHabitGrades] = useState<any[]>([])
  const [isLoadingGrades, setIsLoadingGrades] = useState(false)
  const [newGrade, setNewGrade] = useState({
    materiaId: "",
    nombreMateria: "",
    tipoCalificacion: "NUMERICA",
    tipoEvaluacion: "",
    calificacion: 0,
    valorConceptual: undefined,
    comentario: "",
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingHabitGrades, setEditingHabitGrades] = useState<Record<string, any>>({})
  const [habitEvaluationsGrades, setHabitEvaluationsGrades] = useState<Record<string, { 
    id: string; 
    valor: ValorConceptual; 
    evaluacionHabitoId: string;
    calificaciones?: Array<{ unidad: string; valor: ValorConceptual }>
  }>>({})
  const [extraescolarHabitGrades, setExtraescolarHabitGrades] = useState<Record<string, { id: string; valor: ValorConceptual; evaluacionHabitoId: string }>>({})

  

  // Funciones auxiliares
  const getValorConceptualText = (valor: ValorConceptual) => {
    switch (valor) {
      case "DESTACA":
        return "Destaca"
      case "AVANZA":
        return "Avanza"
      case "NECESITA_MEJORAR":
        return "Necesita Mejorar"
      case "INSATISFACTORIO":
        return "Insatisfactorio"
      default:
        return "No evaluado"
    }
  }

  const getCurrentGrade = (estudiante: Estudiante) => {
    // Como CalificacionPorEstudiante no tiene estudianteId, necesitamos buscar por otro método
    // Por ahora, retornaremos null hasta que implementemos la lógica correcta
    return null
  }

  const closeStudentModal = () => {
    setSelectedStudent(null)
    setActiveTab("info")
    setEditingId(null)
    setNewGrade({
      materiaId: "",
      nombreMateria: "",
      tipoCalificacion: "NUMERICA",
      tipoEvaluacion: "",
      calificacion: 0,
      valorConceptual: undefined,
      comentario: "",
    })
  }

  // Función para cargar calificaciones del estudiante cuando se abre el modal
  const loadStudentGrades = async (studentId: string, periodoId: string) => {
    try {
      setIsLoadingGrades(true)
      
      console.log('🔍 loadStudentGrades - Iniciando carga para:', { studentId, periodoId });
      
      // Cargar calificaciones académicas
      try {
        const gradesResponse = await gradeService.getByStudent(studentId, periodoId)
        console.log('🔍 loadStudentGrades - Calificaciones cargadas:', gradesResponse.length);
        setGrades(gradesResponse)
      } catch (error) {
        console.error('🔍 loadStudentGrades - Error al cargar calificaciones:', error);
        setGrades([])
      }
      
      // Cargar evaluaciones de hábitos
      try {
        const habitResponse = await gradeService.getHabitGrades(studentId, periodoId)
        console.log('🔍 loadStudentGrades - Hábitos cargados:', habitResponse.length);
        setHabitGrades(habitResponse)
      } catch (error) {
        console.error('🔍 loadStudentGrades - Error al cargar hábitos:', error);
        setHabitGrades([])
      }
      
      // Cargar materias disponibles (con manejo de errores) - usar getAllMaterias para administradores
      try {
        const materiasResponse = await dashboardService.getAllMaterias()
        console.log('🔍 loadStudentGrades - Materias cargadas:', materiasResponse.length);
        setMaterias(materiasResponse)
      } catch (error) {
        console.error('🔍 loadStudentGrades - Error al cargar materias:', error);
        setMaterias([])
      }
      
    } catch (error) {
      console.error("Error al cargar calificaciones del estudiante:", error)
      toast.error("Error al cargar las calificaciones")
    } finally {
      setIsLoadingGrades(false)
    }
  }

  // Estado para manejar los cambios en las calificaciones
  const [editingGrades, setEditingGrades] = useState<Map<string, any>>(new Map())

  // Función para manejar cambios en las calificaciones
  const handleGradeChange = (materiaId: string, unidad: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const currentValue = editingGrades.get(materiaId) || {}
    
    setEditingGrades(new Map(editingGrades.set(materiaId, {
      ...currentValue,
      [unidad]: numValue
    })))
  }

  // Función para manejar cambios en hábitos
  const handleHabitChange = (habitId: string, unidad: string, value: string) => {
    const currentValue = editingHabitGrades[habitId] || {}
    
    setEditingHabitGrades({
      ...editingHabitGrades,
      [habitId]: {
        ...currentValue,
        [unidad]: value
      }
    })
  }

  // Función para guardar hábitos
  const handleSaveHabitGrades = async () => {
    try {
      console.log('🔍 handleSaveHabitGrades - Guardando hábitos')
      console.log('🔍 handleSaveHabitGrades - editingHabitGrades:', editingHabitGrades)
      
      const studentId = selectedStudent?.id
      const periodoId = currentPeriod?.id
      
      if (!studentId || !periodoId) {
        toast.error('Faltan datos del estudiante o período')
        return
      }

      // Preparar datos para guardar
      console.log('🔍 handleSaveHabitGrades - habitEvaluationsGrades:', habitEvaluationsGrades)
      
      const calificaciones = Object.entries(editingHabitGrades).map(([habitId, data]) => {
        console.log('🔍 Procesando hábito:', { habitId, data })
        
        // Buscar el hábito actual en habitGrades para obtener sus valores existentes
        const currentHabit = habitGrades.find((h: any) => h.evaluacionHabitoId === habitId)
        console.log('🔍 currentHabit encontrado:', currentHabit)
        
        // Buscar si ya existe una calificación en habitGrades (que ya incluye las calificaciones del estudiante)
        const existingCalificacion = habitGrades.find((h: any) => 
          h.evaluacionHabitoId === habitId && 
          h.u1 !== null || h.u2 !== null || h.u3 !== null || h.u4 !== null
        )
        console.log('🔍 existingCalificacion encontrada:', existingCalificacion)
        
        return {
          key: habitId, // Agregar key para React
          evaluacionHabitoId: habitId,
          // Obtener todas las unidades que se están editando
          u1: data.u1 !== undefined ? data.u1 : (currentHabit?.u1 || null),
          u2: data.u2 !== undefined ? data.u2 : (currentHabit?.u2 || null),
          u3: data.u3 !== undefined ? data.u3 : (currentHabit?.u3 || null),
          u4: data.u4 !== undefined ? data.u4 : (currentHabit?.u4 || null),
          comentario: data.comentario || ''
        }
      })

      console.log('🔍 handleSaveHabitGrades - Calificaciones a enviar:', calificaciones)

      await gradeService.saveHabitGrades(studentId, {
        periodoId,
        calificaciones
      })
      
      // Limpiar el estado de edición
      setEditingHabitGrades({})
      
      // Recargar los hábitos para mostrar los cambios
      await loadStudentGrades(studentId, periodoId)
      
      toast.success('Hábitos guardados correctamente')
    } catch (error) {
      console.error('🔍 handleSaveHabitGrades - Error al guardar hábitos:', error)
      toast.error('Error al guardar los hábitos')
    }
  }

  // Función para guardar las calificaciones
  const handleSaveGrades = async (materiaId: string, materiaData: any) => {
    try {
      console.log('🔍 handleSaveGrades - Guardando calificaciones para materia:', materiaId)
      
      const editedData = editingGrades.get(materiaId) || {}
      const studentId = selectedStudent?.id
      const periodoId = currentPeriod?.id
      
      if (!studentId || !periodoId) {
        toast.error('Faltan datos del estudiante o período')
        return
      }

      // Guardar cada unidad que fue modificada
      const unidades = ['u1', 'u2', 'u3', 'u4']
      
      for (const unidad of unidades) {
        const newValue = editedData[unidad]
        if (newValue !== undefined && newValue !== null) {
          // Buscar la calificación existente para esta unidad
          const existingGrade = materiaData.grades?.find((grade: any) => grade.unidad === unidad)
          
          if (existingGrade) {
            // Actualizar calificación existente
            const updateData: any = {
              tipoCalificacion: existingGrade.tipoCalificacion,
              tipoEvaluacion: existingGrade.tipoEvaluacion,
              materiaId: existingGrade.materiaId,
              periodoId: existingGrade.periodoId,
              unidad: unidad,
              esExtraescolar: materiaData.esExtraescolar || false,
              valorConceptual: newValue,
              calificacion: parseFloat(newValue) || 0,
            };

            await gradeService.update(existingGrade.id, updateData)
          } else {
            // No crear nuevas calificaciones - solo editar existentes
            console.log(`🔍 No existe calificación para unidad ${unidad} - omitiendo creación`)
            toast.warning(`No hay calificación existente para ${unidad}. Solo se pueden editar calificaciones existentes.`)
          }
        }
      }
      
      // Limpiar el estado de edición para esta materia
      const newEditingGrades = new Map(editingGrades)
      newEditingGrades.delete(materiaId)
      setEditingGrades(newEditingGrades)
      
      // Recargar las calificaciones para mostrar los cambios
      await loadStudentGrades(studentId, periodoId)
      
      toast.success('Calificaciones guardadas correctamente')
    } catch (error) {
      console.error('🔍 handleSaveGrades - Error al guardar calificaciones:', error)
      toast.error('Error al guardar las calificaciones')
    }
  }

  // Función para detectar si una materia es extracurricular
  const isExtraescolar = (materiaId: string) => {
    if (!teacherProfile?.materias) return false;
    
    const materia = teacherProfile.materias.find((m: any) => String(m.materiaId) === materiaId);
    if (!materia) return false;
    
    const materiaData = materia.materia || materia;
    const materiaNombre = materiaData?.nombre || '';
    
    // Verificar por tipoMateria
    if (materiaData?.tipoMateria?.nombre === 'EXTRAESCOLAR') {
      return true;
    }
    
    // Verificar por nombre
    const extracurricularNames = [
      'comprensión de lectura',
      'lógica matemática', 
      'moral cristiana',
      'programa de lectura',
      'razonamiento verbal'
    ];
    
    return extracurricularNames.some(name => 
      materiaNombre.toLowerCase().includes(name)
    );
  }

  // useEffects
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        
        const period = await dashboardService.getActiveAcademicPeriod()
        setCurrentPeriod(period)
        
        // Cargar TODOS los grados de la base de datos (admin puede ver todos)
        const allGrades = await dashboardService.getAllGrados()
        setFilteredGrados(allGrades)
        
        const profile = await dashboardService.getTeacherProfile()
        setTeacherProfile(profile)
        
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        toast.error("Error al cargar datos iniciales")
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      loadInitialData()
    }
  }, [token])

  useEffect(() => {
    if (selectedGrade && currentPeriod) {
      loadStudentsForGrade()
    }
  }, [selectedGrade, currentPeriod])

  useEffect(() => {
    // Cargar calificaciones del estudiante cuando se abre el modal
    if (selectedStudent && currentPeriod) {
      loadStudentGrades(selectedStudent.id, currentPeriod.id)
    }
  }, [selectedStudent, currentPeriod])

  const loadStudentsForGrade = async () => {
    try {
      setIsLoadingStudents(true)
      setErrorLoadingStudents(null)
      
      console.log('🔍 AdminGrades - selectedGrade:', selectedGrade);
      
      if (!selectedGrade) {
        throw new Error('No se ha seleccionado un grado');
      }
      
      // selectedGrade siempre es un objeto con formato {grado, nivel, seccion}
      const { grado, nivel, seccion } = selectedGrade;
      
      // Construir el grado completo como está en la base de datos
      const gradoCompleto = `${grado}° ${nivel} ${seccion}`.trim();
      
      console.log('🔍 AdminGrades - Parseado - grado:', grado, 'nivel:', nivel, 'seccion:', seccion);
      console.log('🔍 AdminGrades - Grado completo para búsqueda:', gradoCompleto);
      
      const studentsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students?grado=${encodeURIComponent(gradoCompleto)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        const studentsArray = Array.isArray(studentsData) ? studentsData : (studentsData.data || [])
        console.log('🔍 AdminGrades - Estudiantes encontrados:', studentsArray.length);
        console.log('🔍 AdminGrades - Estudiantes:', studentsArray.map((s: any) => ({ nombre: s.nombre, apellido: s.apellido, grados: s.grados })));
        setStudents(studentsArray)
      } else {
        throw new Error(`Error ${studentsResponse.status}: ${studentsResponse.statusText}`)
      }
    } catch (error) {
      console.error("Error al cargar estudiantes:", error)
      setErrorLoadingStudents("No se pudieron cargar los estudiantes de este grado")
    } finally {
      setIsLoadingStudents(false)
    }
  }

  const filteredStudents = students.filter(student =>
    `${student.nombre} ${student.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.dni?.includes(searchTerm) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando sistema de calificaciones...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Gestión de Calificaciones</h1>
                  <p className="text-sm text-gray-600">Panel Administrativo - Liceo Cristiano Zacapaneco</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Admin
                  </Button>
                </Link>
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
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-6">Gestión Administrativa de Calificaciones</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium mb-2">Seleccionar Grado</h3>
                <Select onValueChange={(value) => {
                  // Convertir el string value al objeto completo
                  const [grado, nivel, seccion] = value.split('|');
                  setSelectedGrade({ grado, nivel, seccion });
                }} value={selectedGrade ? `${selectedGrade.grado}|${selectedGrade.nivel}|${selectedGrade.seccion || ''}` : ""}>
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
                        <TableHead>DPI</TableHead>
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
                          const grade = getCurrentGrade(estudiante)
                          const gradoInfo = estudiante.grados?.[0] || 'N/A'
                          
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
                                  {estudiante.secciones && estudiante.secciones.length > 0 && (
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
                                <div className="flex items-center justify-between gap-4">
                                  <span className="font-medium text-center min-w-[60px]">
                                    {grade !== null ? grade : 'Sin calificación'}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedStudent(estudiante)}
                                      title="Editar calificaciones"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <DownloadGradeReportButton 
                                      key={`pdf-${estudiante.id}`}
                                      estudiante={{
                                          id: estudiante.id,
                                          nombre: estudiante.nombre || '',
                                          apellido: estudiante.apellido || '',
                                          dni: estudiante.dni || '',
                                          grado: estudiante.grados?.[0] || '',
                                          seccion: estudiante.secciones?.[0] || '',
                                          anio: new Date().getFullYear().toString(),
                                        }}
                                        periodo={{
                                          id: currentPeriod?.id || '',
                                          nombre: currentPeriod?.name || 'Período actual',
                                          fechaInicio: currentPeriod?.startDate || new Date().toISOString(),
                                          fechaFin: currentPeriod?.endDate || new Date().toISOString()
                                        }}
                                      />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
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
        </div>

        {/* Student Details Modal - Completo con tabs */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b px-6 py-4">
                <h3 className="text-xl font-semibold">
                  {selectedStudent.nombre}{" "}
                  {selectedStudent.apellido}
                </h3>
                <button
                  onClick={closeStudentModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Student Info */}
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <div className="bg-blue-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                      <User className="h-12 w-12 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-2">
                      {selectedStudent.nombre} {selectedStudent.apellido}
                    </h4>
                    <p className="text-gray-600 mb-4">
                      {selectedStudent.dni || "Sin DNI"}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as "info" | "grades" | "habitos")}
                  className="w-full"
                >
                  <div className="border-b px-6">
                    <TabsList>
                      <TabsTrigger value="info">Información</TabsTrigger>
                      <TabsTrigger value="grades">Calificaciones</TabsTrigger>
                      <TabsTrigger value="habitos">
                        Hábitos y Comportamientos
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6">
                    {/* Información Tab */}
                    <TabsContent value="info">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Información Académica</h4>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p><strong>Grado:</strong> {selectedStudent.grados?.[0] || 'No asignado'}</p>
                            <p><strong>Sección:</strong> {selectedStudent.secciones?.[0] || 'No asignada'}</p>
                            <p><strong>Estado:</strong> {selectedStudent.activo ? 'Activo' : 'Inactivo'}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Calificaciones Tab - Estructura similar al PDF */}
                    <TabsContent value="grades" className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-blue-800 mb-2">
                          Gestión de Calificaciones Académicas
                        </h4>
                        <p className="text-sm text-blue-600">
                          Aquí puedes gestionar las calificaciones académicas del estudiante
                        </p>
                      </div>
                      
                      {isLoadingGrades ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          <span className="ml-2">Cargando calificaciones...</span>
                        </div>
                      ) : grades.length > 0 ? (
                        <>
                          {/* Tabla de Materias Académicas - Similar al PDF */}
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="bg-gray-50">Áreas Académicas</TableHead>
                                  <TableHead className="bg-gray-50">I UNIDAD</TableHead>
                                  <TableHead className="bg-gray-50">II UNIDAD</TableHead>
                                  <TableHead className="bg-gray-50">III UNIDAD</TableHead>
                                  <TableHead className="bg-gray-50">IV UNIDAD</TableHead>
                                  <TableHead className="bg-gray-50">NOTAS FINALES</TableHead>
                                  <TableHead className="bg-gray-50">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(() => {
                                  // Agrupar calificaciones por materia y mostrarlas como en el PDF
                                  const materiasMap = new Map<string, any>();
                                  
                                  for (const grade of grades) {
                                    const materia = grade.materia || {};
                                    const materiaId = materia.id || 'unknown';
                                    
                                    const calificacionValor = grade.calificacion || 0;
                                    const unidad = grade.unidad || 'u1';
                                    
                                    // Si la materia no existe en el mapa, crearla
                                    if (!materiasMap.has(materiaId)) {
                                      const materiaData = {
                                        id: materiaId,
                                        nombre: materia.nombre || 'Materia sin nombre',
                                        tipoMateria: (materia as any).tipoMateria || 'Sin tipo',
                                        tipoMateriaId: (materia as any).tipoMateriaId,
                                        esExtraescolar: grade.esExtraescolar || false,
                                        u1: 0,
                                        u2: 0,
                                        u3: 0,
                                        u4: 0,
                                        final: 0,
                                        grades: [] // Guardar las calificaciones originales para edición
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
                                    
                                    // Guardar la calificación original para edición
                                    materiaExistente.grades.push(grade);
                                    
                                    // Calcular promedio final
                                    const unidades = [materiaExistente.u1, materiaExistente.u2, materiaExistente.u3, materiaExistente.u4];
                                    const unidadesValidas = unidades.filter(u => u > 0);
                                    
                                    if (unidadesValidas.length > 0) {
                                      const promedio = unidadesValidas.reduce((sum, u) => sum + u, 0) / unidadesValidas.length;
                                      materiaExistente.final = Math.round(promedio);
                                    } else {
                                      materiaExistente.final = 0;
                                    }
                                  }
                                  
                                  // Convertir el mapa a array de materias regulares (no extracurriculares)
                                  const materiasRegulares: Array<{
                                    id: string;
                                    nombre_materia: string;
                                    tipoMateria: string;
                                    u1: number;
                                    u2: number;
                                    u3: number;
                                    u4: number;
                                    final: number;
                                    grades: any[];
                                  }> = [];
                                  
                                  for (const materiaData of materiasMap.values()) {
                                    const isExtracurricular = materiaData.esExtraescolar || false;
                                    
                                    if (!isExtracurricular) {
                                      materiasRegulares.push({
                                        id: materiaData.id,
                                        nombre_materia: materiaData.nombre,
                                        tipoMateria: materiaData.tipoMateria,
                                        u1: typeof materiaData.u1 === 'number' ? materiaData.u1 : 0,
                                        u2: typeof materiaData.u2 === 'number' ? materiaData.u2 : 0,
                                        u3: typeof materiaData.u3 === 'number' ? materiaData.u3 : 0,
                                        u4: typeof materiaData.u4 === 'number' ? materiaData.u4 : 0,
                                        final: materiaData.final,
                                        grades: materiaData.grades
                                      });
                                    }
                                  }
                                  
                                  return (
                                    <>
                                      {materiasRegulares.map((materia: any, index: number) => (
                                        <TableRow key={`regular-${index}`}>
                                          <TableCell className="font-medium">
                                            {materia.nombre_materia}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <Input
                                              key={`u1-${materia.id}`}
                                              type="number"
                                              value={editingGrades.get(materia.id)?.u1 ?? materia.u1 ?? ''}
                                              onChange={(e) => handleGradeChange(materia.id, 'u1', e.target.value)}
                                              className="w-20 text-center"
                                              placeholder="0"
                                            />
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <Input
                                              key={`u2-${materia.id}`}
                                              type="number"
                                              value={editingGrades.get(materia.id)?.u2 ?? materia.u2 ?? ''}
                                              onChange={(e) => handleGradeChange(materia.id, 'u2', e.target.value)}
                                              className="w-20 text-center"
                                              placeholder="0"
                                            />
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <Input
                                              key={`u3-${materia.id}`}
                                              type="number"
                                              value={editingGrades.get(materia.id)?.u3 ?? materia.u3 ?? ''}
                                              onChange={(e) => handleGradeChange(materia.id, 'u3', e.target.value)}
                                              className="w-20 text-center"
                                              placeholder="0"
                                            />
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <Input
                                              key={`u4-${materia.id}`}
                                              type="number"
                                              value={editingGrades.get(materia.id)?.u4 ?? materia.u4 ?? ''}
                                              onChange={(e) => handleGradeChange(materia.id, 'u4', e.target.value)}
                                              className="w-20 text-center"
                                              placeholder="0"
                                            />
                                          </TableCell>
                                          <TableCell className="text-center font-bold">
                                            {materia.final || ''}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <Button
                                              key={`save-${materia.id}`}
                                              size="sm"
                                              onClick={() => handleSaveGrades(materia.id, materia)}
                                              className="bg-blue-600 hover:bg-blue-700"
                                            >
                                              Guardar
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                      
                                      {/* Fila de promedios */}
                                      <TableRow className="bg-gray-50">
                                        <TableCell className="font-medium">Promedio por unidad</TableCell>
                                        <TableCell className="text-center font-bold">
                                          {(() => {
                                            const validGrades = materiasRegulares
                                              .filter((m: any) => m.u1 > 0)
                                              .map((m: any) => m.u1);
                                            return validGrades.length > 0 ? 
                                              (validGrades.reduce((sum: number, u: number) => sum + u, 0) / validGrades.length).toFixed(2) : '0.00';
                                          })()}
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                          {(() => {
                                            const validGrades = materiasRegulares
                                              .filter((m: any) => m.u2 > 0)
                                              .map((m: any) => m.u2);
                                            return validGrades.length > 0 ? 
                                              (validGrades.reduce((sum: number, u: number) => sum + u, 0) / validGrades.length).toFixed(2) : '0.00';
                                          })()}
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                          {(() => {
                                            const validGrades = materiasRegulares
                                              .filter((m: any) => m.u3 > 0)
                                              .map((m: any) => m.u3);
                                            return validGrades.length > 0 ? 
                                              (validGrades.reduce((sum: number, u: number) => sum + u, 0) / validGrades.length).toFixed(2) : '0.00';
                                          })()}
                                        </TableCell>
                                        <TableCell className="text-center font-bold">
                                          {(() => {
                                            const validGrades = materiasRegulares
                                              .filter((m: any) => m.u4 > 0)
                                              .map((m: any) => m.u4);
                                            return validGrades.length > 0 ? 
                                              (validGrades.reduce((sum: number, u: number) => sum + u, 0) / validGrades.length).toFixed(2) : '0.00';
                                          })()}
                                        </TableCell>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                      </TableRow>
                                    </>
                                  );
                                })()}
                              </TableBody>
                            </Table>
                          </div>      
                          {/* Mensaje si no hay calificaciones académicas */}
                          {grades.length === 0 && (
                            <div className="text-center py-8">
                              <p className="text-gray-500">No hay calificaciones académicas registradas para este estudiante</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No hay calificaciones académicas registradas para este estudiante</p>
                        </div>
                      )
                    
                    }
                    </TabsContent>
                    {/* Hábitos Tab */}
                    <TabsContent value="habitos" className="space-y-4">
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-amber-800 mb-2">
                          Evaluación de Hábitos y Comportamientos
                        </h4>
                        <p className="text-sm text-amber-600">
                          Aquí puedes gestionar las evaluaciones de hábitos del estudiante
                        </p>
                      </div>
                      
                      {isLoadingGrades ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                          <span className="ml-2">Cargando evaluaciones...</span>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Sección de Extracurriculares (tipo EXTRACURRICULAR) */}
                          {(() => {
                            // Filtrar extracurriculares usando múltiples criterios basados en los datos reales
                            const extracurriculares = habitGrades.filter((h: any) => {
                              // Criterio 1: esExtracurricular === true (más confiable según los datos)
                              const esExtraPorFlag = h.esExtracurricular === true;
                              
                              // Criterio 2: tipoMateriaId específico de extracurriculares
                              const esExtraPorTipoMateriaId = h.tipoMateriaId === '84324295-386d-4d43-9fdd-043ac7689b22';
                              
                              // Criterio 3: tipo === 'EXTRACURRICULAR' (si existe)
                              const esExtraPorTipo = h.tipo === 'EXTRACURRICULAR';
                              
                              // Criterio 4: tipoMateriaNombre === 'EXTRACURRICULAR' (si existe)
                              const esExtraPorTipoMateriaNombre = h.tipoMateriaNombre === 'EXTRACURRICULAR';
                              
                              // Criterio 5: Por nombre (fallback)
                              const nombresExtra = [
                                'comprensión de lectura',
                                'lógica matemática', 
                                'moral cristiana',
                                'programa de lectura',
                                'razonamiento verbal'
                              ];
                              const nombre = (h.nombre || '').toLowerCase();
                              const esExtraPorNombre = nombresExtra.some(n => nombre.includes(n));
                              
                              // Criterio 6: Verificar que la materia esté disponible para el grado seleccionado
                              let esValidaParaGrado = true; // Por defecto es válida si no hay grado seleccionado
                              let debugGradoInfo = '';
                              
                              if (selectedGrade && h.grados) {
                                // Construir el grado completo como está en la base de datos
                                console.log(`🔍 Admin - Entrando en sección CON grados para ${h.nombre}:`, {
                                  tieneGrados: !!h.grados,
                                  grados: h.grados,
                                  esExtracurricular: h.esExtracurricular
                                });
                                const { grado, nivel, seccion } = selectedGrade;
                                const gradoCompleto = `${grado}° ${nivel} ${seccion}`.trim();
                                const gradoSinSeccion = `${grado}° ${nivel}`.trim();
                                const gradoBase = `${grado} ${nivel}`.trim();
                                
                                debugGradoInfo = `Grado: ${gradoCompleto} | SinSeccion: ${gradoSinSeccion} | Base: ${gradoBase}`;
                                
                                // Verificar todas las formas posibles
                                const check1 = h.grados.includes(gradoCompleto);
                                const check2 = h.grados.includes(gradoSinSeccion);
                                const check3 = h.grados.includes(gradoBase);
                                const check4 = h.grados.includes(`${grado}° PC`); // 👈 Agregar formato "4° PC"
                                const check5 = h.grados.some((g: string) => 
                                  g.includes(`${grado}°`) && g.includes(nivel)
                                );
                                
                                esValidaParaGrado = check1 || check2 || check3 || check4 || check5;
                                
                                if (h.esExtracurricular === true) {
                                  console.log(`🔍 Grado Check - ${h.nombre}:`, {
                                    materiaGrados: h.grados,
                                    gradoCompleto,
                                    gradoSinSeccion,
                                    gradoBase,
                                    checks: { check1, check2, check3, check4, check5 },
                                    resultado: esValidaParaGrado,
                                    debugInfo: debugGradoInfo
                                  });
                                }
                              } else if (selectedGrade && !h.grados) {
                                // Si no tiene campo grados, usar el mismo filtrado por nombre que en el PDF
                                console.log(`🔍 Admin - Entrando en sección SIN grados para ${h.nombre}:`, {
                                  tieneGrados: !!h.grados,
                                  grados: h.grados,
                                  esExtracurricular: h.esExtracurricular,
                                  selectedGrade
                                });
                                const { grado, nivel } = selectedGrade;
                                const gradoEstudiante = `${grado}° ${nivel}`;
                                
                                const nombresPorGrado = {
                                  '1° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                                  '2° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                                  '3° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                                  '4° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                                  '5° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                                  '6° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                                  '1° Básico': ['Moral Cristiana', 'Programa de Lectura'],
                                  '2° Básico': ['Moral Cristiana', 'Programa de Lectura'],
                                  '3° Básico': ['Moral Cristiana', 'Programa de Lectura'],
                                  '4° PC': ['Moral Cristiana', 'Programa de Lectura'],
                                  '5° PC': ['Moral Cristiana', 'Programa de Lectura'],
                                  '6° PC': ['Moral Cristiana', 'Programa de Lectura'],
                                  '4° Perito Contador': ['Moral Cristiana', 'Programa de Lectura'],
                                  '5° Perito Contador': ['Moral Cristiana', 'Programa de Lectura'],
                                  '6° Perito Contador': ['Moral Cristiana', 'Programa de Lectura'],
                                  '4° Perito': ['Moral Cristiana', 'Programa de Lectura'],
                                  '5° Perito': ['Moral Cristiana', 'Programa de Lectura'],
                                  '6° Perito': ['Moral Cristiana', 'Programa de Lectura'],
                                  '4° BCL': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                                  '5° BCL': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                                  '6° BCL': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                                  // Agregar más formatos para Bachillerato
                                  '4° Bachillerato': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                                  '5° Bachillerato': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                                  '6° Bachillerato': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                                  '4° Bachillerato en Ciencias y Letras': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                                  '5° Bachillerato en Ciencias y Letras': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                                  '6° Bachillerato en Ciencias y Letras': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal']
                                };
                                
                                // Construir formatos específicos según el tipo de grado
                                let formatosParaBuscar = [gradoEstudiante];
                                let nombresValidos: string[] = [];
                                
                                if (nivel.includes('Perito')) {
                                  formatosParaBuscar = [
                                    gradoEstudiante,
                                    `${grado}° ${nivel}`, // "4° Perito Contador"
                                    `${grado}° ${nivel.split(' ')[0]}`, // "4° Perito"
                                    `${grado} PC`, // "4 PC"
                                    `${grado}° PC`, // "4° PC" 👈 ESTE FALTABA
                                    `${grado} Perito` // "4 Perito"
                                  ];
                                } else if (nivel.includes('Bachillerato') || nivel.includes('BCL') || nivel.includes('Ciencias') || nivel.includes('Letras')) {
                                  formatosParaBuscar = [
                                    gradoEstudiante,
                                    `${grado}° BCL`, // "4° BCL"
                                    `${grado} BCL`, // "4 BCL"
                                    `${grado}° Bachillerato`, // "4° Bachillerato"
                                    `${grado} Bachillerato`, // "4 Bachillerato"
                                    `${grado}° Bachillerato en Ciencias y Letras`, // "4° Bachillerato en Ciencias y Letras"
                                    `${grado} Bachillerato en Ciencias y Letras` // "4 Bachillerato en Ciencias y Letras"
                                  ];
                                } else if (nivel.includes('Básico')) {
                                  formatosParaBuscar = [
                                    gradoEstudiante,
                                    `${grado}° ${nivel}`, // "1° Básico"
                                    `${grado} Básico` // "1 Básico"
                                  ];
                                } else if (nivel.includes('Primaria')) {
                                  formatosParaBuscar = [
                                    gradoEstudiante,
                                    `${grado}° ${nivel}`, // "4° Primaria"
                                    `${grado} Primaria` // "4 Primaria"
                                  ];
                                }
                                
                                for (const formato of formatosParaBuscar) {
                                  const encontrados = nombresPorGrado[formato as keyof typeof nombresPorGrado] || [];
                                  if (encontrados.length > 0) {
                                    nombresValidos = encontrados;
                                    break;
                                  }
                                }
                                
                                esValidaParaGrado = nombresValidos.includes(h.nombre);
                                
                                console.log(`🔍 Admin - Filtrado por nombre ${h.nombre}:`, {
                                  gradoEstudiante,
                                  formatosParaBuscar,
                                  nombresValidos,
                                  esValida: esValidaParaGrado
                                });
                              }
                              
                              const esExtra = esExtraPorFlag || esExtraPorTipoMateriaId || esExtraPorTipo || esExtraPorTipoMateriaNombre || esExtraPorNombre;
                              
                              // Solo incluir si es extracurricular Y es válida para el grado seleccionado
                              return esExtra && (!selectedGrade || esValidaParaGrado);
                            });
                            
                            console.log('🔍 Hábitos - Total habitGrades:', habitGrades.length);
                            console.log('🔍 Hábitos - Grado seleccionado:', selectedGrade);
                            console.log('🔍 Hábitos - Extracurriculares encontradas:', extracurriculares.length);
                            console.log('🔍 Hábitos - Todos los tipos:', [...new Set(habitGrades.map((h: any) => h.tipo))]);
                            console.log('🔍 Hábitos - esExtracurricular flags:', habitGrades.filter((h: any) => h.esExtracurricular === true).map((h: any) => ({nombre: h.nombre, grados: h.grados})));
                            console.log('🔍 Hábitos - Nombres de extracurriculares:', extracurriculares.map((h: any) => h.nombre));
                            console.log('🔍 Hábitos - Datos completos de extracurriculares:', habitGrades.filter((h: any) => h.esExtracurricular === true).map((h: any) => ({
                              nombre: h.nombre,
                              esExtracurricular: h.esExtracurricular,
                              tipoMateriaId: h.tipoMateriaId,
                              grados: h.grados,
                              tipo: h.tipo
                            })));
                            
                            return extracurriculares.length > 0 ? (
                              <div className="bg-green-50 p-4 rounded-lg">
                                <h5 className="font-semibold text-green-800 mb-4">
                                  Áreas Extracurriculares
                                </h5>
                                <div className="space-y-4">
                                  {extracurriculares.map((habit: any) => {
                                    // Crear key única combinando múltiples campos para evitar duplicados
                                    const habitKey = `${habit.evaluacionHabitoId || habit.id || 'unknown'}-${habit.tipo || 'EXTRACURRICULAR'}-${habit.nombre || 'unnamed'}`;
                                    return (
                                    <div key={habitKey} className="bg-white p-4 rounded-lg border">
                                      <h6 className="font-medium text-green-700 mb-3">
                                        {habit.nombre || 'Hábito sin nombre'}
                                      </h6>
                                      
                                      <div className="grid grid-cols-4 gap-4 mb-4">
                                        {['u1', 'u2', 'u3', 'u4'].map((unidad) => (
                                          <div key={unidad} className="space-y-2">
                                            <Label className="text-sm font-medium">
                                              {unidad.toUpperCase()}
                                            </Label>
                                            <Select
                                              value={editingHabitGrades[habitKey]?.[unidad] || habit[unidad] || ''}
                                              onValueChange={(value) => handleHabitChange(habitKey, unidad, value)}
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Seleccionar" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem key="DESTACA" value="DESTACA">DESTACA</SelectItem>
                                                <SelectItem key="AVANZA" value="AVANZA">AVANZA</SelectItem>
                                                <SelectItem key="NECESITA_MEJORAR" value="NECESITA MEJORAR">NECESITA MEJORAR</SelectItem>
                                                <SelectItem key="INSATISFACTORIO" value="INSATISFACTORIO">INSATISFACTORIO</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium">Comentario</Label>
                                        <Input
                                          value={editingHabitGrades[habitKey]?.comentario || habit.comentario || ''}
                                          onChange={(e) => handleHabitChange(habitKey, 'comentario', e.target.value)}
                                          placeholder="Agregar comentario..."
                                          className="w-full"
                                        />
                                      </div>
                                    </div>
                                    );
                                  })}
                                </div>
                                
                                <div className="mt-4 flex justify-end">
                                  <Button
                                    onClick={handleSaveHabitGrades}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Guardar Extracurriculares
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-600">
                                  No hay evaluaciones extracurriculares registradas para este estudiante
                                </p>
                              </div>
                            )}
                          )()}
                          
                          {/* Otras categorías de hábitos */}
                          {['CASA', 'APRENDIZAJE', 'COMPORTAMIENTO'].map((tipo) => {
                            const habitosTipo = habitGrades.filter((h: any) => h.tipo === tipo);
                            
                            if (habitosTipo.length === 0) return null;
                            
                            return (
                              <div key={tipo} className="bg-blue-50 p-4 rounded-lg">
                                <h5 className="font-semibold text-blue-800 mb-4">
                                  {tipo === 'CASA' ? 'Hábitos en Casa' : 
                                   tipo === 'APRENDIZAJE' ? 'Responsabilidad en el Aprendizaje' : 
                                   'Responsabilidad y Comportamiento'}
                                </h5>
                                <div className="space-y-4">
                                  {habitosTipo.map((habit: any) => {
                                    // Crear key única combinando múltiples campos para evitar duplicados
                                    const habitKey = `${habit.evaluacionHabitoId || habit.id || 'unknown'}-${habit.tipo}-${habit.nombre || 'unnamed'}`;
                                    return (
                                    <div key={habitKey} className="bg-white p-3 rounded-lg border">
                                      <h6 className="font-medium text-blue-700 mb-2">
                                        {habit.nombre || 'Hábito sin nombre'}
                                      </h6>
                                      
                                      <div className="grid grid-cols-4 gap-2">
                                        {['u1', 'u2', 'u3', 'u4'].map((unidad) => (
                                          <div key={unidad} className="text-center">
                                            <div className="text-xs font-medium text-gray-600 mb-1">
                                              {unidad.toUpperCase()}
                                            </div>
                                            <div className="text-sm">
                                              {habit[unidad] || '-'}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {habit.comentario && (
                                        <div className="mt-2 text-sm text-gray-600">
                                          <strong>Comentario:</strong> {habit.comentario}
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
                <Button variant="outline" onClick={closeStudentModal}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
