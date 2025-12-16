"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Download, BarChart3, FileText, Users, TrendingUp, Calendar, Filter } from "lucide-react"
import Link from "next/link"

export default function AdminReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("current")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [reportType, setReportType] = useState("general")

  const [stats] = useState({
    totalStudents: 450,
    totalTeachers: 15,
    totalClasses: 48,
    averageGrade: 84.2,
    attendanceRate: 92.5,
    passRate: 89.3,
  })

  const [gradeDistribution] = useState([
    { range: "90-100", count: 125, percentage: 27.8 },
    { range: "80-89", count: 180, percentage: 40.0 },
    { range: "70-79", count: 95, percentage: 21.1 },
    { range: "60-69", count: 35, percentage: 7.8 },
    { range: "0-59", count: 15, percentage: 3.3 },
  ])

  const [topPerformers] = useState([
    { name: "Sofía Hernández", grade: "1° Básico", average: 98.5 },
    { name: "Carlos Rodríguez", grade: "1° Primaria", average: 96.8 },
    { name: "Ana María García", grade: "1° Primaria", average: 95.2 },
    { name: "José Antonio Pérez", grade: "2° Primaria", average: 94.7 },
    { name: "María José López", grade: "2° Primaria", average: 93.1 },
  ])

  const [teacherPerformance] = useState([
    { name: "Prof. Juan Pérez", subject: "Matemáticas", classAverage: 87.5, students: 96 },
    { name: "Prof. María González", subject: "Español", classAverage: 89.2, students: 72 },
    { name: "Prof. Carlos Rodríguez", subject: "Ciencias", classAverage: 85.8, students: 54 },
    { name: "Prof. Ana López", subject: "Literatura", classAverage: 91.3, students: 25 },
  ])

  const generateReport = (type: string) => {
    // Simular generación de reporte
    alert(`Generando reporte de ${type}...`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Reportes y Estadísticas</h1>
                <p className="text-sm text-gray-600">Análisis y reportes administrativos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button onClick={() => generateReport("completo")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Configuración de Reportes
            </CardTitle>
            <CardDescription>Selecciona los parámetros para generar reportes personalizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Período Actual</SelectItem>
                    <SelectItem value="semester">Semestre Completo</SelectItem>
                    <SelectItem value="year">Año Académico</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nivel Educativo</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Niveles</SelectItem>
                    <SelectItem value="preescolar">Preescolar</SelectItem>
                    <SelectItem value="primaria">Primaria</SelectItem>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="diversificado">Diversificado</SelectItem>
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
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="academic">Académico</SelectItem>
                    <SelectItem value="attendance">Asistencia</SelectItem>
                    <SelectItem value="teachers">Docentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Formato</Label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="academic">Académico</TabsTrigger>
            <TabsTrigger value="teachers">Docentes</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Promedio General</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.averageGrade}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tasa de Asistencia</p>
                      <p className="text-3xl font-bold text-green-600">{stats.attendanceRate}%</p>
                    </div>
                    <Calendar className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tasa de Aprobación</p>
                      <p className="text-3xl font-bold text-purple-600">{stats.passRate}%</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Notas</CardTitle>
                <CardDescription>Distribución de estudiantes por rango de notas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gradeDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="w-16 justify-center">
                          {item.range}
                        </Badge>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.count} estudiantes</p>
                        <p className="text-sm text-gray-600">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reportes Rápidos</CardTitle>
                  <CardDescription>Genera reportes comunes con un clic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("notas-generales")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Reporte de Notas General
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("asistencia")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reporte de Asistencia
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("rendimiento-docentes")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Rendimiento de Docentes
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("estadisticas-completas")}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Estadísticas Completas
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 5 Estudiantes</CardTitle>
                  <CardDescription>Mejores promedios del período</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.map((student, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.grade}</p>
                        </div>
                        <Badge className="bg-green-500">{student.average}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento Académico por Materia</CardTitle>
                <CardDescription>Promedios y estadísticas por materia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherPerformance.map((teacher, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{teacher.subject}</p>
                        <p className="text-sm text-gray-600">{teacher.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{teacher.classAverage}</p>
                        <p className="text-sm text-gray-600">{teacher.students} estudiantes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reportes Académicos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("por-materia")}
                  >
                    Rendimiento por Materia
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("por-grado")}
                  >
                    Rendimiento por Grado
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("comparativo")}
                  >
                    Análisis Comparativo
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Tendencias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("tendencias-mensuales")}
                  >
                    Tendencias Mensuales
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("progreso-estudiantes")}
                  >
                    Progreso de Estudiantes
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("alertas-academicas")}
                  >
                    Alertas Académicas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Docentes</CardTitle>
                <CardDescription>Estadísticas y métricas por docente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherPerformance.map((teacher, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-sm text-gray-600">{teacher.subject}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="font-semibold">{teacher.classAverage}</p>
                          <p className="text-xs text-gray-600">Promedio</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{teacher.students}</p>
                          <p className="text-xs text-gray-600">Estudiantes</p>
                        </div>
                        <Badge
                          variant={
                            teacher.classAverage >= 90
                              ? "default"
                              : teacher.classAverage >= 80
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {teacher.classAverage >= 90 ? "Excelente" : teacher.classAverage >= 80 ? "Bueno" : "Regular"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reportes de Docentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("evaluacion-docentes")}
                  >
                    Evaluación de Docentes
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("carga-academica")}
                  >
                    Carga Académica
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("efectividad-enseñanza")}
                  >
                    Efectividad de Enseñanza
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Desempeño</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("comparativo-docentes")}
                  >
                    Comparativo entre Docentes
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("mejores-practicas")}
                  >
                    Mejores Prácticas
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => generateReport("areas-mejora")}
                  >
                    Áreas de Mejora
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reporte Personalizado</CardTitle>
                <CardDescription>Crea reportes específicos según tus necesidades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Fecha de Inicio</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Fin</Label>
                    <Input type="date" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Métricas a Incluir</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Promedios por materia</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Asistencia</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">Comportamiento</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Rendimiento docentes</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">Comparativas</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">Gráficos</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => generateReport("personalizado")}>
                    <Download className="h-4 w-4 mr-2" />
                    Generar Reporte Personalizado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
