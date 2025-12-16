"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, ArrowLeft, Search, Filter, Users, Calendar, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function ReportsPage() {
  const searchParams = useSearchParams()
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedGrade, setSelectedGrade] = useState("all")
  const [selectedBimester, setSelectedBimester] = useState(searchParams.get("bimester") || "1")
  const [selectedYear, setSelectedYear] = useState(searchParams.get("year") || "2024")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [reportType, setReportType] = useState("individual")

  const levels = [
    { value: "preescolar", label: "Preescolar", grades: ["Preescolar"] },
    {
      value: "primaria",
      label: "Primaria",
      grades: ["1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria"],
    },
    { value: "basico", label: "Básico", grades: ["1° Básico", "2° Básico", "3° Básico"] },
    { value: "diversificado", label: "Diversificado", grades: ["4° Diversificado", "5° Diversificado"] },
  ]

  const bimesters = [
    { value: "1", label: "1° Bimestre", period: "Enero - Marzo" },
    { value: "2", label: "2° Bimestre", period: "Abril - Junio" },
    { value: "3", label: "3° Bimestre", period: "Julio - Septiembre" },
    { value: "4", label: "4° Bimestre", period: "Octubre - Diciembre" },
    { value: "annual", label: "Reporte Anual", period: "Año Completo" },
  ]

  const students = [
    {
      id: "1",
      name: "Ana María García",
      grade: "1° Primaria",
      level: "primaria",
      bimester1: 85,
      bimester2: 87,
      bimester3: null,
      bimester4: null,
      annual: 86,
    },
    {
      id: "2",
      name: "Carlos Rodríguez",
      grade: "1° Primaria",
      level: "primaria",
      bimester1: 92,
      bimester2: 89,
      bimester3: null,
      bimester4: null,
      annual: 90.5,
    },
    {
      id: "3",
      name: "María José López",
      grade: "2° Primaria",
      level: "primaria",
      bimester1: 78,
      bimester2: 82,
      bimester3: null,
      bimester4: null,
      annual: 80,
    },
    {
      id: "4",
      name: "José Antonio Pérez",
      grade: "3° Básico",
      level: "basico",
      bimester1: 88,
      bimester2: 85,
      bimester3: null,
      bimester4: null,
      annual: 86.5,
    },
    {
      id: "5",
      name: "Sofía Hernández",
      grade: "3° Básico",
      level: "basico",
      bimester1: 95,
      bimester2: 93,
      bimester3: null,
      bimester4: null,
      annual: 94,
    },
    {
      id: "6",
      name: "Diego Morales",
      grade: "4° Diversificado",
      level: "diversificado",
      bimester1: 82,
      bimester2: 84,
      bimester3: null,
      bimester4: null,
      annual: 83,
    },
  ]

  const filteredStudents = students.filter((student) => {
    const matchesLevel = selectedLevel === "all" || student.level === selectedLevel
    const matchesGrade = selectedGrade === "all" || student.grade === selectedGrade
    const matchesSearch = !searchTerm || student.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesLevel && matchesGrade && matchesSearch
  })

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId])
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    }
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map((s) => s.id))
    }
  }

  const generateReports = () => {
    if (selectedStudents.length === 0) {
      alert("Por favor selecciona al menos un estudiante")
      return
    }

    const bimesterInfo = bimesters.find((b) => b.value === selectedBimester)
    alert(`Generando ${selectedStudents.length} reportes PDF para ${bimesterInfo?.label} ${selectedYear}...`)
  }

  const getCurrentBimesterInfo = () => {
    return bimesters.find((b) => b.value === selectedBimester)
  }

  const getStudentGrade = (student: any) => {
    if (selectedBimester === "annual") return student.annual
    const bimesterKey = `bimester${selectedBimester}` as keyof typeof student
    return student[bimesterKey]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Generar Reportes PDF</h1>
              <p className="text-sm text-gray-600">Crea reportes por bimestre y estudiante</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="individual" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="individual">Reportes Individuales</TabsTrigger>
            <TabsTrigger value="consolidated">Reportes Consolidados</TabsTrigger>
            <TabsTrigger value="comparative">Reportes Comparativos</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-6">
            {/* Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Selección de Período
                </CardTitle>
                <CardDescription>Elige el período académico para generar los reportes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ciclo Escolar</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Período de Evaluación</Label>
                    <Select value={selectedBimester} onValueChange={setSelectedBimester}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bimesters.map((bimester) => (
                          <SelectItem key={bimester.value} value={bimester.value}>
                            <div>
                              <div className="font-medium">{bimester.label}</div>
                              <div className="text-xs text-gray-500">{bimester.period}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Reporte</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual por Estudiante</SelectItem>
                        <SelectItem value="detailed">Detallado con Gráficos</SelectItem>
                        <SelectItem value="summary">Resumen Ejecutivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {getCurrentBimesterInfo() && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Período seleccionado:</strong> {getCurrentBimesterInfo()?.label} {selectedYear} (
                      {getCurrentBimesterInfo()?.period})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filtros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nivel Educativo</Label>
                      <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos los niveles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los niveles</SelectItem>
                          {levels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedLevel !== "all" && (
                      <div className="space-y-2">
                        <Label>Grado</Label>
                        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todos los grados" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los grados</SelectItem>
                            {levels
                              .find((l) => l.value === selectedLevel)
                              ?.grades.map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Buscar Estudiante</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Nombre del estudiante..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Formatos de Reporte</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">Preescolar - Formato Visual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Primaria - Formato Estándar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className="text-sm">Básico - Formato Detallado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span className="text-sm">Diversificado - Formato Académico</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Students List */}
              <div className="lg:col-span-3 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Estudiantes ({filteredStudents.length})
                        </CardTitle>
                        <CardDescription>
                          Selecciona los estudiantes para generar reportes del {getCurrentBimesterInfo()?.label}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleSelectAll}>
                          {selectedStudents.length === filteredStudents.length
                            ? "Deseleccionar Todo"
                            : "Seleccionar Todo"}
                        </Button>
                        <Badge variant="secondary">{selectedStudents.length} seleccionados</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                            />
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-gray-600">{student.grade}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                getStudentGrade(student) === null
                                  ? "outline"
                                  : getStudentGrade(student) >= 90
                                    ? "default"
                                    : getStudentGrade(student) >= 80
                                      ? "secondary"
                                      : "destructive"
                              }
                            >
                              {selectedBimester === "annual" ? "Promedio" : getCurrentBimesterInfo()?.label}:{" "}
                              {getStudentGrade(student) || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {filteredStudents.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No se encontraron estudiantes con los filtros aplicados
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Reports */}
                {selectedStudents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Generar Reportes</CardTitle>
                      <CardDescription>
                        Se generarán {selectedStudents.length} reportes PDF para {getCurrentBimesterInfo()?.label}{" "}
                        {selectedYear}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Button onClick={generateReports} size="lg">
                          <Download className="h-4 w-4 mr-2" />
                          Generar {selectedStudents.length} Reportes PDF
                        </Button>
                        <div className="text-sm text-gray-600">Los reportes se descargarán automáticamente</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="consolidated" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Reportes por Clase
                  </CardTitle>
                  <CardDescription>Genera reportes consolidados por clase y materia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Reporte General por Clase - {getCurrentBimesterInfo()?.label}
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Estadísticas de Rendimiento - {getCurrentBimesterInfo()?.label}
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Lista de Estudiantes con Notas - {getCurrentBimesterInfo()?.label}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Reportes por Período
                  </CardTitle>
                  <CardDescription>Reportes que abarcan múltiples bimestres</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Reporte Semestral (1° y 2° Bimestre)
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Reporte Anual Completo {selectedYear}
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Progreso por Bimestre
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparative" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Comparativas entre Bimestres
                  </CardTitle>
                  <CardDescription>Analiza la evolución del rendimiento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Comparativa 1° vs 2° Bimestre
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Tendencias de Mejora por Estudiante
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Ranking de Rendimiento por Bimestre
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Comparativas entre Grupos
                  </CardTitle>
                  <CardDescription>Compara el rendimiento entre diferentes grupos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Comparativa entre Grados
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Comparativa entre Materias
                  </Button>
                  <Button className="w-full justify-start bg-transparent" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Análisis de Rendimiento por Nivel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
