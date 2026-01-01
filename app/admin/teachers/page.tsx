"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Plus, Edit, Trash2, Eye, Mail, Phone, UserCheck, UserX, Calendar, CalendarDays, FileText, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { regularSubjects } from "@/lib/data/academicData"

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
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [editFormData, setEditFormData] = useState<Partial<Teacher> & { selectedMaterias: string[] } | null>(null)
  const [availableMaterias, setAvailableMaterias] = useState<Materia[]>([])
  const [isMateriasOpen, setIsMateriasOpen] = useState(false)
  const [materiasSearch, setMateriasSearch] = useState('')
  const { token } = useAuth()

  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        console.log('🔍 Fetching materias from API...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/materias`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          credentials: 'include'
        });

        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Error response:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          throw new Error(`Error al cargar las materias: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Raw response data:', data);
        
        const materiasData = Array.isArray(data) ? data : (data.data || []);
        console.log('✅ Total materias recibidas:', materiasData.length);
        
        // Filtrar solo materias curriculares (esExtracurricular: false)
        const materiasCurriculares = materiasData.filter((m: any) => 
          m.esExtracurricular === false
        );
        
        console.log('📚 Materias curriculares:', materiasCurriculares.length);
        
        // Mapear al formato esperado
        const mappedMaterias = materiasCurriculares.map((materia: any) => ({
          id: materia.id,
          nombre: materia.nombre,
          descripcion: materia.descripcion || '',
          grado: materia.grado || '',
          nivel: materia.nivel || '',
          seccion: materia.seccion || '',
          docenteId: 0, // Se asignará cuando se asigne a un docente
          estudiantes: 0
        }));

        console.log('🔄 Materias mapeadas:', mappedMaterias);
        setAvailableMaterias(mappedMaterias);
        
      } catch (error) {
        console.error('❌ Error en fetchMaterias:', error);
        toast.error('Error al cargar las materias. Por favor, intente de nuevo.');
      }
    };

    fetchMaterias();
  }, []);

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true)
      try {
        console.log('Fetching teachers...')
        const response = await api.get('/auth/teachers')
        
        if (response.status >= 200 && response.status < 300) {
          // Extract the data array from the response
          const teachersData = Array.isArray(response.data?.data) ? response.data.data : []
          console.log('Teachers data:', teachersData)
          
          setTeachers(teachersData)
        } else {
          throw new Error('Error al cargar los docentes')
        }
      } catch (error) {
        console.error('Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Error al cargar la lista de docentes'
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchTeachers()
    }
  }, [token])

  useEffect(() => {
    const handleClickOutside = () => {
      if (isMateriasOpen) {
        setIsMateriasOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMateriasOpen])

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

      const response = await api.patch(`/auth/teachers/${teacherId}/status`, { 
        status: !teacher.activo 
      })

      if (response.status >= 200 && response.status < 300) {
        setTeachers(teachers.map(t => 
          t.id === teacherId ? { ...t, activo: !t.activo } : t
        ))
        toast.success(`Docente ${!teacher.activo ? 'activado' : 'desactivado'} correctamente`)
      } else {
        throw new Error(response.data?.message || 'Error al actualizar el estado del docente')
      }
    } catch (error) {
      console.error('Error updating teacher status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el estado del docente'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (teacherId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este docente?")) return

    try {
      const response = await api.delete(`/teachers/${teacherId}`)
      
      if (response.status >= 200 && response.status < 300) {
        setTeachers(teachers.filter(teacher => teacher.id !== teacherId))
        toast.success('Docente eliminado correctamente')
      } else {
        throw new Error('Error al eliminar el docente')
      }
    } catch (error) {
      console.error('Error deleting teacher:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el docente';
      toast.error(errorMessage);
    }
  }

  const handleInputChange = (field: keyof Teacher, value: string | string[] | boolean) => {
    setEditFormData(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSaveChanges = async () => {
    console.log('Saving changes...');
    if (!selectedTeacher || !editFormData) {
      console.error('No selected teacher or form data');
      return;
    }

    try {
      const currentSelectedMaterias = [...(editFormData.selectedMaterias || [])];
      console.log('Current selected materias:', currentSelectedMaterias);
      
      // Create an array of Materia objects from the selected IDs
      const materiasToSend = currentSelectedMaterias.map(id => {
        const materia = availableMaterias.find(m => m.id === id);
        return materia ? { id: materia.id, nombre: materia.nombre } : { id, nombre: '' };
      });

      console.log('Sending materias:', materiasToSend);

      const requestData = {
        nombre: editFormData.nombre,
        apellido: editFormData.apellido,
        email: editFormData.email,
        telefono: editFormData.telefono,
        direccion: editFormData.direccion,
        dni: editFormData.dni,
        fechaNacimiento: editFormData.fechaNacimiento,
        contactoEmergencia: editFormData.contactoEmergencia,
        telefonoEmergencia: editFormData.telefonoEmergencia,
        grados: editFormData.grados || [],
        materias: materiasToSend, // Send full materia objects with id and nombre
        activo: editFormData.activo,
      };

      console.log('Request payload:', requestData);

      const response = await api.put(`/auth/teachers/${selectedTeacher.id}`, requestData);

      if (response.status >= 200 && response.status < 300) {
        // Update the local state with the new data
        const updatedTeacher: Teacher = {
          ...selectedTeacher,
          ...editFormData,
          materias: materiasToSend
        };
        
        setTeachers(teachers.map(teacher => 
          teacher.id === selectedTeacher.id ? updatedTeacher : teacher
        ));
        toast.success('Docente actualizado correctamente');
        setIsEditDialogOpen(false);
      } else {
        throw new Error('Error al actualizar el docente');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      toast.error('Error al actualizar el docente');
    }
  }

  const toggleMateria = (materiaId: string) => {
    console.log('Toggling materia:', materiaId);
    if (!editFormData) {
      console.error('No editFormData available');
      return;
    }
    
    setEditFormData(prev => {
      if (!prev) return null;
      
      const currentMaterias = [...(prev.selectedMaterias || [])];
      const materiaIndex = currentMaterias.indexOf(materiaId);
      
      if (materiaIndex === -1) {
        currentMaterias.push(materiaId);
      } else {
        currentMaterias.splice(materiaIndex, 1);
      }
      
      console.log('Updated selected materias:', currentMaterias);
      
      const updated = {
        ...prev,
        selectedMaterias: [...currentMaterias],
        materias: availableMaterias
          .filter(m => currentMaterias.includes(m.id))
          .map(m => ({ id: m.id, nombre: m.nombre }))
      };
      
      console.log('Updated form data:', updated);
      return updated;
    });
  }

  const removeMateria = (materiaId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editFormData) return
    
    const currentMaterias = [...(editFormData.selectedMaterias || [])]
    const updatedMaterias = currentMaterias.filter(id => id !== materiaId)
    
    setEditFormData({
      ...editFormData,
      selectedMaterias: updatedMaterias,
      materias: availableMaterias
        .filter(m => updatedMaterias.includes(m.id))
        .map(m => ({ id: m.id, nombre: m.nombre }))
    })
  }

  const openViewDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsViewDialogOpen(true)
  }

  const openEditDialog = (teacher: Teacher) => {
    console.log('Opening edit dialog for teacher:', teacher);
    setSelectedTeacher(teacher);
    
    // Handle both string and Materia object formats for materias
    const materiasIds = Array.isArray(teacher.materias) 
      ? teacher.materias.map(m => {
          if (typeof m === 'string') {
            return m; // If it's already an ID (string)
          } else if (m && typeof m === 'object' && m.id) {
            return m.id; // If it's a Materia object
          }
          return ''; // Fallback for invalid data
        }).filter(Boolean) // Remove any empty strings
      : [];

    console.log('Mapped materias IDs:', materiasIds);
    
    const formData = {
      id: teacher.id,
      nombre: teacher.nombre || '',
      apellido: teacher.apellido || '',
      email: teacher.email || '',
      telefono: teacher.telefono || '',
      direccion: teacher.direccion || '',
      dni: teacher.dni || '',
      fechaNacimiento: teacher.fechaNacimiento ? new Date(teacher.fechaNacimiento).toISOString().split('T')[0] : '',
      contactoEmergencia: teacher.contactoEmergencia || '',
      telefonoEmergencia: teacher.telefonoEmergencia || '',
      grados: [...(teacher.grados || [])],
      materias: teacher.materias || [],
      selectedMaterias: materiasIds,
      activo: teacher.activo,
    };
    
    console.log('Setting form data:', formData);
    setEditFormData(formData);
    setIsEditDialogOpen(true);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" onClick={() => isMateriasOpen && setIsMateriasOpen(false)}>
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
                              onClick={() => router.push(`/admin/teachers/new?edit=${teacher.id}`)}
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

        {/* Edit Teacher Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Docente</DialogTitle>
            </DialogHeader>
            {editFormData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={editFormData.nombre || ''}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      value={editFormData.apellido || ''}
                      onChange={(e) => handleInputChange('apellido', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={editFormData.telefono || ''}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI</Label>
                    <Input
                      id="dni"
                      value={editFormData.dni || ''}
                      onChange={(e) => handleInputChange('dni', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={editFormData.fechaNacimiento || ''}
                      onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactoEmergencia">Contacto de Emergencia</Label>
                    <Input
                      id="contactoEmergencia"
                      value={editFormData.contactoEmergencia || ''}
                      onChange={(e) => handleInputChange('contactoEmergencia', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefonoEmergencia">Teléfono de Emergencia</Label>
                    <Input
                      id="telefonoEmergencia"
                      value={editFormData.telefonoEmergencia || ''}
                      onChange={(e) => handleInputChange('telefonoEmergencia', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={editFormData.direccion || ''}
                      onChange={(e) => handleInputChange('direccion', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="activo">Estado</Label>
                    <Select
                      value={editFormData.activo ? 'active' : 'inactive'}
                      onValueChange={(value) => handleInputChange('activo', value === 'active')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Materias Asignadas</Label>
                    <div className="relative">
                      <div 
                        className="flex flex-wrap gap-2 p-2 border rounded-md min-h-10 cursor-pointer"
                        onClick={() => setIsMateriasOpen(!isMateriasOpen)}
                      >
                        {editFormData.selectedMaterias && editFormData.selectedMaterias.length > 0 ? (
                          editFormData.selectedMaterias.map(materiaId => {
                            const materia = availableMaterias.find(m => m.id === materiaId)
                            return materia ? (
                              <div key={materiaId} className="flex items-center bg-gray-100 px-2 py-1 rounded-md text-sm">
                                {materia.nombre}
                                <X 
                                  className="h-3 w-3 ml-1 text-gray-500 hover:text-red-500"
                                  onClick={(e) => removeMateria(materiaId, e)}
                                />
                              </div>
                            ) : null
                          })
                        ) : (
                          <span className="text-sm text-gray-400">Seleccionar materias...</span>
                        )}
                      </div>
                      
                      {isMateriasOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Buscar materias..."
                              value={materiasSearch}
                              onChange={(e) => setMateriasSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full"
                            />
                          </div>
                          <div className="py-1">
                            {availableMaterias
                              .filter(materia => 
                                materia.nombre.toLowerCase().includes(materiasSearch.toLowerCase())
                              )
                              .map((materia) => (
                                <div
                                  key={materia.id}
                                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                                    editFormData.selectedMaterias?.includes(materia.id) ? 'bg-blue-50' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleMateria(materia.id)
                                  }}
                                >
                                  {materia.nombre}
                                </div>
                              ))}
                            {availableMaterias.filter(materia => 
                              materia.nombre.toLowerCase().includes(materiasSearch.toLowerCase())
                            ).length === 0 && (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No se encontraron materias
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    Guardar Cambios
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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