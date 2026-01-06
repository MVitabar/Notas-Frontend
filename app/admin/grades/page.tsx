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
  Filter
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

// Importar servicios
import { dashboardService } from "@/lib/services/dashboardService"
import gradeService from "@/lib/services/gradeService"
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

interface CalificacionResponse {
  id: string;
  estudianteId: string;
  materiaId: string;
  periodoId: string;
  docenteId: string;
  calificacion?: number;
  tipoCalificacion: "NUMERICA" | "CONCEPTUAL";
  tipoEvaluacion: string;
  valorConceptual?: "DESTACA" | "AVANZA" | "NECESITA_MEJORAR" | "INSATISFACTORIO";
  fecha: string;
  comentario?: string;
  createdAt: string;
  updatedAt: string;
  unidad?: string;
  materia?: {
    id: string;
    nombre: string;
  };
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
  const [students, setStudents] = useState<Estudiante[]>([])
  const [classInfo, setClassInfo] = useState<{
    grado: string;
    nivel: string;
    seccion?: string;
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number | "">("")
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [errorLoadingStudents, setErrorLoadingStudents] = useState<string | null>(null)
  
  // Estados adicionales
  const [teacherProfile, setTeacherProfile] = useState<any>(null)
  const [currentPeriod, setCurrentPeriod] = useState<any>(null)
  const [bimestres, setBimestres] = useState<Bimestre[]>([])
  const [selectedBimester, setSelectedBimester] = useState("1")
  const [filteredGrados, setFilteredGrados] = useState<GradoInfo[]>([])
  const [classGrades, setClassGrades] = useState<CalificacionResponse[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null)
  const [activeTab, setActiveTab] = useState<"info" | "grades" | "habitos" | "extraescolar">("info")
  const [grades, setGrades] = useState<CalificacionResponse[]>([])

  const evaluationPeriods = [
    { id: "PARCIAL_1", name: "Parcial 1" },
    { id: "PARCIAL_2", name: "Parcial 2" },
    { id: "PARCIAL_3", name: "Parcial 3" },
    { id: "PARCIAL_4", name: "Parcial 4" },
    { id: "EXAMEN_FINAL", name: "Examen Final" },
    { id: "TRABAJO_FINAL", name: "Trabajo Final" }
  ]

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
    const grade = classGrades.find(g => g.estudianteId === estudiante.id)
    return grade ? grade.calificacion : null
  }

  const closeStudentModal = () => {
    setSelectedStudent(null)
    setActiveTab("info")
  }

  const handleSaveStudentGrade = async (studentId: string) => {
    try {
      if (!editValue) return

      const grade = classGrades.find(g => g.estudianteId === studentId)
      if (!grade) {
        toast.error("No se encontró la calificación para actualizar")
        return
      }

      await gradeService.update(grade.id, { calificacion: Number(editValue) })
      setClassGrades(prevGrades => 
        prevGrades.map(g => 
          g.id === grade.id 
            ? { ...g, calificacion: Number(editValue) }
            : g
        )
      )
      setEditingId(null)
      setEditValue("")
      toast.success("Calificación actualizada correctamente")
    } catch (error) {
      console.error("Error al actualizar calificación:", error)
      toast.error("Error al actualizar la calificación")
    }
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
                          const grade = getCurrentGrade(estudiante)
                          const isEditing = editingId === estudiante.id
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
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value ? Number(e.target.value) : "")}
                                      className="w-20"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        handleSaveStudentGrade(estudiante.id)
                                      }}
                                      className="h-8 w-8"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingId(null)}
                                      className="h-8 w-8"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="font-medium text-center min-w-[60px]">
                                      {grade !== null ? grade : 'Sin calificación'}
                                    </span>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingId(estudiante.id)}
                                        title="Editar calificación"
                                        className="h-8 w-8 p-0"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedStudent(estudiante)}
                                        title="Ver detalles"
                                        className="h-8 w-8 p-0"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <DownloadGradeReportButton 
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
                                )}
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

        {/* Student Details Modal - Simplificado para admin */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex-shrink-0">
                    <div className="bg-blue-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-12 w-12 text-blue-600" />
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

                <div className="text-center py-8">
                  <p className="text-gray-500">La gestión detallada de calificaciones estará disponible próximamente para administradores</p>
                  <p className="text-sm text-gray-400 mt-2">Puedes usar el botón de descarga de PDF para ver el reporte completo del estudiante</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
