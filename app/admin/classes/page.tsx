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
import { ArrowLeft, Search, Plus, Edit, Trash2, Eye, Users, Clock, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ClassItem {
  id: string
  docente: {
    nombre: string
    apellido: string
    email: string
  }
  grado: string
  materia: string
  horario: string
  aula: string
  anioAcademico: string
  semestre: string
  cupoMaximo: number
  estudiantesInscritos: number
  activo: boolean
  descripcion: string
  createdAt: string
  updatedAt: string
  // Alias properties for backward compatibility
  enrolledStudents: number
  maxStudents: number
  status: boolean
  description: string
  classroom: string
  academicYear: string
  semester: string
  schedule: string
}

export default function ClassesManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState<ClassItem[]>([])

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clases`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Error al cargar las clases')
        }

        const data = await response.json()
        setClasses(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching classes:', error)
        toast.error("No se pudieron cargar las clases")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [])

  // Add computed properties for backward compatibility
  const classesWithAliases = classes.map(cls => ({
    ...cls,
    enrolledStudents: cls.estudiantesInscritos,
    maxStudents: cls.cupoMaximo,
    status: cls.activo ? 'active' : 'inactive',
    description: cls.descripcion,
    classroom: cls.aula,
    academicYear: cls.anioAcademico,
    semester: cls.semestre,
    schedule: cls.horario,
    materia: cls.materia,
    grado: cls.grado,
    teacherName: cls.docente ? `${cls.docente.nombre} ${cls.docente.apellido}` : 'Sin docente',
    teacherEmail: cls.docente?.email || ''
  }))

  const filteredClasses = classesWithAliases.filter((classItem) => {
    const matchesSearch = searchTerm === "" || 
      classItem.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.materia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.grado.toString().toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGrade = gradeFilter === "all" || classItem.grado === gradeFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && classItem.activo === true) || 
      (statusFilter === "inactive" && classItem.activo === false)

    return matchesSearch && matchesGrade && matchesStatus
  })

  const handleStatusToggle = async (classId: string) => {
    try {
      const token = localStorage.getItem('token')
      const classToUpdate = classes.find(c => c.id === classId)
      if (!classToUpdate) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clases/${classId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activo: !classToUpdate.activo })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el estado de la clase')
      }

      setClasses(classes.map((classItem) =>
        classItem.id === classId
          ? { ...classItem, activo: !classItem.activo }
          : classItem
      ))
      
      toast.success("Estado de la clase actualizado correctamente")
    } catch (error) {
      console.error('Error updating class status:', error)
      toast.error("No se pudo actualizar el estado de la clase")
    }
  }

  const handleDelete = async (classId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta clase?")) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clases/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la clase')
      }

      setClasses(classes.filter((classItem) => classItem.id !== classId))
      toast.success("Clase eliminada correctamente")
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error("No se pudo eliminar la clase")
    }
  }

  const openViewDialog = (classItem: typeof classesWithAliases[number]) => {
    setSelectedClass(classItem as unknown as ClassItem)
    setIsViewDialogOpen(true)
  }

  const openEditDialog = (classItem: typeof classesWithAliases[number]) => {
    setSelectedClass(classItem as unknown as ClassItem)
    setIsEditDialogOpen(true)
  }

  const getEnrollmentColor = (enrolled: number, max: number) => {
    if (max === 0) return "text-gray-600"
    const percentage = (enrolled / max) * 100
    if (percentage >= 100) return "text-red-600"
    if (percentage >= 80) return "text-yellow-600"
    return "text-green-600"
  }

  const uniqueGrades = Array.from(new Set(classes.map((c) => c.grado.toString()))).sort()

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
                <h1 className="text-xl font-bold text-gray-900">Gestión de Clases</h1>
                <p className="text-sm text-gray-600">Administrar clases y asignaciones</p>
              </div>
            </div>
            <Link href="/classes/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Clase
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
                )}
                <p className="text-sm text-gray-600">Total Clases</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    {classes.filter((c) => c.activo).length}
                  </p>
                )}
                <p className="text-sm text-gray-600">Activas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {classes.reduce((sum, c) => sum + c.estudiantesInscritos, 0)}
                </p>
                <p className="text-sm text-gray-600">Estudiantes Inscritos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {(
                    (classes.reduce((sum, c) => sum + c.estudiantesInscritos, 0) /
                      classes.reduce((sum, c) => sum + c.cupoMaximo, 0) || 0) *
                    100
                  ).toFixed(0)}
                  %
                </p>
                <p className="text-sm text-gray-600">Ocupación</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por docente, materia o grado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los grados</SelectItem>
                    {uniqueGrades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activas</SelectItem>
                    <SelectItem value="inactive">Inactivas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clases ({filteredClasses.length})</CardTitle>
            <CardDescription>Gestiona las clases y sus asignaciones</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Docente</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Materia</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Aula</TableHead>
                  <TableHead>Inscritos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500" />
                      <p className="mt-2 text-sm text-gray-600">Cargando clases...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron clases
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClasses.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{classItem.teacherName}</span>
                          <span className="text-xs text-gray-500">{classItem.teacherEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>{classItem.grado}</TableCell>
                      <TableCell>{classItem.materia}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          {classItem.horario}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {classItem.aula || 'No especificada'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={getEnrollmentColor(classItem.estudiantesInscritos, classItem.cupoMaximo)}>
                            {classItem.estudiantesInscritos} / {classItem.cupoMaximo || '∞'}
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            {classItem.cupoMaximo > 0 && (
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min(100, (classItem.estudiantesInscritos / classItem.cupoMaximo) * 100)}%`,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={classItem.activo ? "default" : "secondary"} className={!classItem.activo ? 'bg-gray-100 text-gray-800' : ''}>
                          {classItem.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(classItem)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(classItem)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(classItem.id)}
                            title="Eliminar"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Class Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Información de la Clase</DialogTitle>
              <DialogDescription>Detalles completos de la clase</DialogDescription>
            </DialogHeader>
            {selectedClass && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Materia</Label>
                    <p className="text-lg font-semibold">{selectedClass.materia}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Grado</Label>
                    <p className="text-lg font-semibold">{selectedClass.grado}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Docente</Label>
                    <p>{selectedClass.docente ? `${selectedClass.docente.nombre} ${selectedClass.docente.apellido}` : 'Sin docente'}</p>
                    <p className="text-sm text-gray-600">{selectedClass.docente?.email || ''}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Estado</Label>
                    <div className="mt-1">
                      <Badge variant={selectedClass.activo ? "default" : "secondary"} className={!selectedClass.activo ? 'bg-gray-100 text-gray-800' : ''}>
                        {selectedClass.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Horario</Label>
                    <p>{selectedClass.horario}</p>
                    <p>{selectedClass.schedule}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Aula</Label>
                    <p>{selectedClass.classroom}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Año Académico</Label>
                    <p>{selectedClass.academicYear}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Semestre</Label>
                    <p>{selectedClass.semester}° Semestre</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Estudiantes</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedClass.enrolledStudents}</p>
                      <p className="text-sm text-gray-600">Inscritos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedClass.maxStudents}</p>
                      <p className="text-sm text-gray-600">Máximo</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {((selectedClass.enrolledStudents / selectedClass.maxStudents) * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-600">Ocupación</p>
                    </div>
                  </div>
                </div>

                {selectedClass.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Descripción</Label>
                    <p className="mt-1">{selectedClass.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Class Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Clase</DialogTitle>
              <DialogDescription>Modifica la información de la clase</DialogDescription>
            </DialogHeader>
            {selectedClass && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="materia">Materia</Label>
                    <Input id="materia" defaultValue={selectedClass.materia} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grado">Grado</Label>
                    <Input id="grado" defaultValue={selectedClass.grado} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Horario</Label>
                    <Input id="schedule" defaultValue={selectedClass.schedule} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classroom">Aula</Label>
                    <Input id="classroom" defaultValue={selectedClass.classroom} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Máximo de Estudiantes</Label>
                  <Input id="maxStudents" type="number" defaultValue={selectedClass.maxStudents} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select 
                    value={selectedClass.activo ? 'active' : 'inactive'}
                    onValueChange={(value) => {
                      setSelectedClass({
                        ...selectedClass,
                        activo: value === 'active'
                      });
                    }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="inactive">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsEditDialogOpen(false)}>Guardar Cambios</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
