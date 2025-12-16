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
import { ArrowLeft, Search, Plus, Edit, Trash2, Eye, Mail, Phone, UserCheck, UserX, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  studentCode?: string;
  grade: string;
  parentName: string;
  parentPhone?: string;
  parentEmail?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  medicalInfo?: string;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
}

export default function StudentsManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [uniqueGrades, setUniqueGrades] = useState<string[]>([])
  const [editFormData, setEditFormData] = useState<Partial<Student> | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        console.log('Fetching students from API...');
        const response = await api.get('/students');
        console.log('API Response:', response);
        
        // Map the API response to match the expected Student type
        const studentsData = response.data.map((apiStudent: any) => ({
          id: apiStudent.id,
          firstName: apiStudent.nombre || '',
          lastName: apiStudent.apellido || '',
          dateOfBirth: apiStudent.fechaNacimiento || '',
          studentCode: apiStudent.dni || '',
          grade: apiStudent.grados?.[0] || 'Sin grado',
          parentName: apiStudent.contactoEmergencia || '',
          parentPhone: apiStudent.telefono || '',
          parentEmail: apiStudent.email || '',
          emergencyContact: apiStudent.contactoEmergencia || '',
          emergencyPhone: apiStudent.telefonoEmergencia || '',
          address: apiStudent.direccion || '',
          medicalInfo: '', // Not provided in the API response
          status: apiStudent.activo ? 'active' : 'inactive',
          createdAt: apiStudent.createdAt,
          updatedAt: apiStudent.updatedAt
        }));

        console.log('Mapped students data:', studentsData);
        setStudents(studentsData);
        
        // Update unique grades
        const grades = new Set<string>();
        studentsData.forEach((student: Student) => {
          if (student.grade) {
            grades.add(student.grade);
          }
        });
        setUniqueGrades(Array.from(grades).sort());
        
      } catch (error) {
        console.error('Error fetching students:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        toast.error('Error al cargar los estudiantes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [])

  // Función para extraer grados únicos de los estudiantes
  const getUniqueGrades = (students: Student[]): string[] => {
    const grades = new Set<string>();
    students.forEach(student => {
      if (student.grade) {
        grades.add(student.grade);
      }
    });
    return Array.from(grades).sort();
  };

  // Actualizar grados únicos cuando cambian los estudiantes
  useEffect(() => {
    setUniqueGrades(getUniqueGrades(students));
  }, [students]);

  // Función de filtrado mejorada
  const filteredStudents = students.filter((student) => {
    // Búsqueda por nombre, apellido o DNI
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      (student.studentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? student.status === 'active' : student.status !== 'active');
      
    return matchesSearch && matchesGrade && matchesStatus;
  })

  const handleStatusToggle = (studentId: string) => {
    setStudents(
      students.map((student) =>
        student.id === studentId
          ? { ...student, status: student.status === 'active' ? 'inactive' : 'active' }
          : student,
      ),
    )
  }

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este estudiante?')) return;
    
    try {
      const response = await api.delete(`/api/students/${id}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setStudents(students.filter(student => student.id !== id));
      toast.success('Estudiante eliminado correctamente');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el estudiante');
    }
  }

  const openViewDialog = (student: Student) => {
    setSelectedStudent(student)
    setIsViewDialogOpen(true)
  }

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student);
    setEditFormData({ ...student });
    setIsEditDialogOpen(true);
  }

  const handleInputChange = (field: keyof Student, value: string) => {
    setEditFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveChanges = async () => {
    if (!selectedStudent || !editFormData) return;

    try {
      // Map the form data to match the API expected format
      const apiData = {
        nombre: editFormData.firstName,
        apellido: editFormData.lastName,
        dni: editFormData.studentCode,
        fechaNacimiento: editFormData.dateOfBirth,
        telefono: editFormData.parentPhone,
        email: editFormData.parentEmail,
        direccion: editFormData.address,
        activo: editFormData.status === 'active',
        contactoEmergencia: editFormData.emergencyContact,
        telefonoEmergencia: editFormData.emergencyPhone,
        grados: [editFormData.grade || '']
      };

      const response = await api.put(`/students/${selectedStudent.id}`, apiData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Update the students list with the updated data
      setStudents(students.map(student => 
        student.id === selectedStudent.id ? { 
          ...student, 
          ...editFormData,
          grade: editFormData.grade || student.grade
        } : student
      ));

      toast.success('Estudiante actualizado correctamente');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el estudiante');
    }
  };

  const getAverageColor = (average: number) => {
    if (average >= 90) return "text-green-600"
    if (average >= 80) return "text-blue-600"
    if (average >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const grades = [
    { level: "Preescolar", grades: ["Preescolar"] },
    {
      level: "Primaria",
      grades: ["1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria"],
    },
    { level: "Básico", grades: ["1° Básico", "2° Básico", "3° Básico"] },
    { level: "Diversificado", grades: ["4° Diversificado", "5° Diversificado"] },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando estudiantes...</span>
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
                <h1 className="text-xl font-bold text-gray-900">Gestión de Estudiantes</h1>
                <p className="text-sm text-gray-600">Administrar estudiantes e inscripciones</p>
              </div>
            </div>
            <Link href="/admin/students/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Estudiante
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
                <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                <p className="text-sm text-gray-600">Total Estudiantes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {students.filter((s) => s.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600">Activos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{students.filter((s) => s.studentCode).length}</p>
                <p className="text-sm text-gray-600">Con Código</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {(students.reduce((sum, s) => sum + (s.studentCode ? 1 : 0), 0) / students.length).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">Promedio de Códigos</p>
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
                    placeholder="Buscar por nombre, apellido o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por grado" />
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
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className=" gap-6 mb-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Lista de Estudiantes ({filteredStudents.length})</CardTitle>
            <CardDescription>Gestiona la información de los estudiantes</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                    <TableCell>{student.grade || 'Sin grado'}</TableCell>
                    <TableCell>{student.studentCode || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(student)}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(student)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStudent(student.id)}
                          title="Eliminar"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Student Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Información del Estudiante</DialogTitle>
              <DialogDescription>Detalles completos del estudiante</DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nombre Completo</Label>
                    <h3 className="text-lg font-medium">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">Código: {selectedStudent.studentCode || 'N/A'}</p>
                    <p className="text-sm text-gray-500">
                      Fecha de Nacimiento: {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 'No especificada'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Grado: {selectedStudent.grade || 'Sin grado'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Estado:</span>
                      <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}>
                        {selectedStudent.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Contacto de Emergencia</p>
                    <p className="text-sm">
                      {selectedStudent.emergencyContact || 'No especificado'}
                      {selectedStudent.emergencyPhone && ` (${selectedStudent.emergencyPhone})`}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Información del Padre/Madre</Label>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Contacto Principal</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedStudent.parentEmail || 'Sin correo'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedStudent.parentPhone || 'Sin teléfono'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Dirección</p>
                  <p className="text-sm">{selectedStudent.address || 'No especificada'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Fecha de Registro</p>
                  <p className="text-sm">
                    {selectedStudent.createdAt 
                      ? new Date(selectedStudent.createdAt).toLocaleDateString() 
                      : 'No disponible'
                    }
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Estudiante</DialogTitle>
              <DialogDescription>Modifica la información del estudiante</DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input 
                      id="firstName" 
                      value={editFormData?.firstName || ''} 
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input 
                      id="lastName" 
                      value={editFormData?.lastName || ''} 
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentCode">Código</Label>
                    <Input 
                      id="studentCode" 
                      value={editFormData?.studentCode || ''} 
                      onChange={(e) => handleInputChange('studentCode', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date" 
                      value={editFormData?.dateOfBirth ? new Date(editFormData.dateOfBirth).toISOString().split('T')[0] : ''} 
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentName">Nombre del Padre/Madre</Label>
                  <Input 
                    id="parentName" 
                    value={editFormData?.parentName || ''} 
                    onChange={(e) => handleInputChange('parentName', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Teléfono</Label>
                    <Input 
                      id="parentPhone" 
                      value={editFormData?.parentPhone || ''} 
                      onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Email</Label>
                    <Input 
                      id="parentEmail" 
                      type="email" 
                      value={editFormData?.parentEmail || ''} 
                      onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input 
                    id="address" 
                    value={editFormData?.address || ''} 
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select 
                    value={editFormData?.status || 'inactive'}
                    onValueChange={(value) => handleInputChange('status', value as 'active' | 'inactive' | 'suspended')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="suspended">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </div>
  )
}
