"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Plus, Edit, Trash2, Eye, Mail, Phone, UserCheck, UserX, Calendar, CalendarDays, FileText } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { toast } from "sonner"

interface Materia {
  id: string
  nombre: string
  [key: string]: any
}

interface Teacher {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  activo: boolean
  materias: (string | Materia)[]
  grados: string[]
  fechaCreacion: string
  requiereCambioPassword: boolean
  rol?: string
  direccion?: string | null
  fechaNacimiento?: string | null
  dni?: string | null
  contactoEmergencia?: string | null
  telefonoEmergencia?: string | null
}

export default function TeachersManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const { token } = useAuth()

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching teachers from:', `${process.env.NEXT_PUBLIC_API_URL}/auth/teachers`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/teachers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Error al cargar los docentes: ' + errorText);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      // Extract the data array from the response
      const teachersData = Array.isArray(result.data) ? result.data : [];
      console.log('Teachers data:', teachersData);
      
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar la lista de docentes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTeachers();
    }
  }, [token])

  const filteredTeachers = (Array.isArray(teachers) ? teachers : []).filter((teacher) => {
    const matchesSearch =
      (teacher?.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (teacher?.apellido?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (teacher?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && teacher?.activo) || 
      (statusFilter === "inactive" && !teacher?.activo)

    return matchesSearch && matchesStatus
  })

  const handleStatusToggle = async (teacherId: string) => {
    try {
      const teacher = teachers.find(t => t.id === teacherId)
      if (!teacher) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !teacher.activo })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del docente')
      }

      setTeachers(teachers.map(t => 
        t.id === teacherId ? { ...t, activo: !t.activo } : t
      ))

      toast.success(`Docente ${!teacher.activo ? 'activado' : 'desactivado'} correctamente`)
    } catch (error) {
      console.error('Error updating teacher status:', error)
      toast.error('Error al actualizar el estado del docente')
    }
  }

  const handleDelete = async (teacherId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este docente?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el docente')
      }

      setTeachers(teachers.filter(teacher => teacher.id !== teacherId))
      toast.success('Docente eliminado correctamente')
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error('Error al eliminar el docente')
    }
  }

  const openViewDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsViewDialogOpen(true)
  }

  const openEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
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
                <h1 className="text-xl font-bold text-gray-900">Gestión de Docentes</h1>
                <p className="text-sm text-gray-600">Administrar profesores y sus asignaciones</p>
              </div>
            </div>
            <Link href="/admin/teachers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Docente
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Buscar docentes..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{teachers.length}</p>
                <p className="text-sm text-gray-600">Total Docentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {teachers.filter((t) => t.activo).length}
                </p>
                <p className="text-sm text-gray-600">Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {teachers.flatMap(t => t.materias).filter((v, i, a) => a.indexOf(v) === i).length}
                </p>
                <p className="text-sm text-gray-600">Materias Diferentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {teachers.flatMap(t => t.grados).filter((v, i, a) => a.indexOf(v) === i).length}
                </p>
                <p className="text-sm text-gray-600">Grados Diferentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lista de Docentes</CardTitle>
            <CardDescription>
              {filteredTeachers.length} docentes encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Docente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Materias</TableHead>
                    <TableHead>Grados</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <UserCheck className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium">{teacher.nombre} {teacher.apellido}</p>
                              <p className="text-sm text-gray-500">{teacher.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {teacher.telefono && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {teacher.telefono}
                              </div>
                            )}
                            {teacher.direccion && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                {teacher.direccion}
                              </div>
                            )}
                            {teacher.fechaNacimiento && (
                              <div className="flex items-center text-sm text-gray-600">
                                <CalendarDays className="h-4 w-4 mr-2 text-gray-400" />
                                {teacher.fechaNacimiento}
                              </div>
                            )}
                            {teacher.dni && (
                              <div className="flex items-center text-sm text-gray-600">
                                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                {teacher.dni}
                              </div>
                            )}
                            {teacher.contactoEmergencia && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {teacher.contactoEmergencia}
                              </div>
                            )}
                            {teacher.telefonoEmergencia && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                {teacher.telefonoEmergencia}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {teacher.materias?.length > 0 ? (
                              teacher.materias.map((materia, i) => (
                                <Badge key={i} variant="outline" className="mb-1">
                                  {typeof materia === 'object' && materia !== null ? (materia as Materia).nombre : String(materia)}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">Sin materias</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {teacher.grados?.length > 0 ? (
                              teacher.grados.map((grado, i) => (
                                <Badge key={i} variant="secondary" className="mb-1">
                                  {grado}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">Sin grados</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`h-2.5 w-2.5 rounded-full mr-2 ${teacher.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span>{teacher.activo ? 'Activo' : 'Inactivo'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openViewDialog(teacher)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(teacher)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStatusToggle(teacher.id)}
                              className={teacher.activo ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
                            >
                              {teacher.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No se encontraron docentes que coincidan con la búsqueda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Teacher Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalles del Docente</DialogTitle>
            </DialogHeader>
            {selectedTeacher && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{`${selectedTeacher.nombre} ${selectedTeacher.apellido}`}</h3>
                  <p className="text-sm text-gray-500">{selectedTeacher.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p>{selectedTeacher.telefono || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Estado</p>
                    <Badge variant={selectedTeacher.activo ? "default" : "secondary"}>
                      {selectedTeacher.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Materias</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.materias?.length > 0 ? (
                      selectedTeacher.materias.map((materia, index) => {
                        const materiaNombre = typeof materia === 'object' && materia !== null 
                          ? (materia as Materia).nombre 
                          : String(materia);
                        return (
                          <Badge key={index} variant="outline">
                            {materiaNombre}
                          </Badge>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">Sin materias asignadas</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Grados</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeacher.grados?.length > 0 ? (
                      selectedTeacher.grados.map((grado, index) => (
                        <Badge key={index} variant="outline">
                          {grado}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Sin grados asignados</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}