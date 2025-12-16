"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BookOpen, GraduationCap, Settings, BarChart3, UserPlus, School, FileText, Plus, Loader2, Calendar } from "lucide-react"
import Link from "next/link"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

interface DashboardStats {
  totalTeachers: number
  totalStudents: number
  totalSubjects: number
  totalClasses?: number
  activeClasses?: number
  totalGrades?: number
}

export default function AdminDashboard() {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalTeachers: 0,
    totalStudents: 0,
    totalSubjects: 0,
    // Optional fields with default values for backward compatibility
    totalClasses: 0,
    activeClasses: 0,
    totalGrades: 0
  })

  const fetchStudentsCount = async (): Promise<number> => {
    try {
      if (!token) {
        console.error('No se encontró el token de autenticación');
        return 0;
      }

      console.log('Obteniendo estudiantes desde /students...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          console.log(`Se encontraron ${data.length} estudiantes`);
          return data.length;
        } else if (data && Array.isArray(data.data)) {
          console.log(`Se encontraron ${data.data.length} estudiantes en data.data`);
          return data.data.length;
        }
      } else if (response.status === 403) {
        console.error('Error 403: No tienes permiso para acceder a este recurso');
        toast.error('No tienes los permisos necesarios para ver los estudiantes');
      } else {
        console.error(`Error al obtener estudiantes: ${response.status} ${response.statusText}`);
      }
      
      return 0;
    } catch (error) {
      console.error('Error inesperado al obtener estudiantes:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      return 0;
    }
  };

  const fetchSubjectsCount = async (): Promise<number> => {
    try {
      if (!token) {
        console.error('No se encontró el token de autenticación');
        return 0;
      }

      console.log('Obteniendo materias desde /materias...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/materias`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          console.log(`Se encontraron ${data.length} materias`);
          return data.length;
        } else if (data && Array.isArray(data.data)) {
          console.log(`Se encontraron ${data.data.length} materias en data.data`);
          return data.data.length;
        }
      } else if (response.status === 403) {
        console.error('Error 403: No tienes permiso para acceder a este recurso');
        toast.error('No tienes los permisos necesarios para ver las materias');
      } else {
        console.error(`Error al obtener materias: ${response.status} ${response.statusText}`);
      }
      
      return 0;
    } catch (error) {
      console.error('Error inesperado al obtener materias:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      return 0;
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Initialize stats with default values
        const newStats: DashboardStats = {
          totalTeachers: 0,
          totalStudents: 0,
          totalSubjects: 0,
          totalClasses: 0,
          activeClasses: 0,
          totalGrades: 0
        };

        try {
          // Fetch teachers
          const teachersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/teachers`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (teachersRes.ok) {
            const teachersData = await teachersRes.json();
            newStats.totalTeachers = Array.isArray(teachersData.data) ? teachersData.data.length : 0;
          } else {
            console.warn('No se pudo obtener el total de docentes');
          }

          // Fetch students count
          const studentsCount = await fetchStudentsCount();
          newStats.totalStudents = studentsCount;
          
          // Fetch subjects count
          const subjectsCount = await fetchSubjectsCount();
          newStats.totalSubjects = subjectsCount;
          
        } catch (error) {
          console.error('Error al obtener datos:', error);
        }

        // Update stats with the values we could fetch
        setStats(newStats);
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        toast.error('Error al cargar las estadísticas del dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    if (token) {
      fetchStats()
    }
  }, [token])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <School className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Panel de Administración</h1>
                  <p className="text-sm text-gray-600">Liceo Cristiano Zacapaneco - Sistema de Gestión</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Docentes</p>
                    {isLoading ? (
                      <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <p className="text-3xl font-bold text-blue-600">{stats.totalTeachers}</p>
                    )}
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Estudiantes</p>
                    {isLoading ? (
                      <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
                    )}
                  </div>
                  <GraduationCap className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Materias</p>
                    {isLoading ? (
                      <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <p className="text-3xl font-bold text-orange-600">{stats.totalSubjects}</p>
                    )}
                  </div>
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            {isLoading && (
              <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <p>Cargando datos del dashboard...</p>
                </div>
              </div>
            )}
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="teachers">Docentes</TabsTrigger>
              <TabsTrigger value="students">Estudiantes</TabsTrigger>
              <TabsTrigger value="reports">Reportes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                    <CardDescription>Gestiones frecuentes del sistema</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link href="/admin/teachers/new">
                      <Button className="w-full justify-start">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Registrar Nuevo Docente
                      </Button>
                    </Link>
                    <Link href="/admin/students/new">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Inscribir Estudiante
                      </Button>
                    </Link>
                    <Link href="/admin/reports">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Generar Reportes
                      </Button>
                    </Link>
                    <Link href="/academic-periods">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Calendar className="h-4 w-4 mr-2" />
                        Gestionar Períodos Académicos
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Recent Activity - Removed mock data */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>El registro de actividad estará disponible pronto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-gray-500">La funcionalidad de actividad reciente se implementará próximamente</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="teachers">
              <Link href="/admin/teachers">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <CardTitle>Gestión de Docentes</CardTitle>
                    <CardDescription>Administrar profesores, permisos y asignaciones</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button size="lg">Ver Gestión de Docentes</Button>
                  </CardContent>
                </Card>
              </Link>
            </TabsContent>

            <TabsContent value="students">
              <Link href="/admin/students">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <GraduationCap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <CardTitle>Gestión de Estudiantes</CardTitle>
                    <CardDescription>Administrar estudiantes, inscripciones y expedientes</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button size="lg">Ver Gestión de Estudiantes</Button>
                  </CardContent>
                </Card>
              </Link>
            </TabsContent>

            <TabsContent value="classes">
              <Link href="/admin/classes">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <BookOpen className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <CardTitle>Gestión de Clases</CardTitle>
                    <CardDescription>Administrar clases, horarios y asignaciones</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button size="lg">Ver Gestión de Clases</Button>
                  </CardContent>
                </Card>
              </Link>
            </TabsContent>

            <TabsContent value="reports">
              <Link href="/admin/reports">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <CardTitle>Reportes y Estadísticas</CardTitle>
                    <CardDescription>Generar reportes administrativos y estadísticas</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button size="lg">Ver Reportes</Button>
                  </CardContent>
                </Card>
              </Link>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}
