"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Loader2, 
  UserPlus, 
  Copy, 
  Check, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { extracurricularSubjects, availableGrades } from "@/lib/data/academicData"

export default function NewTeacherPage() {
  const router = useRouter()
  const { token, user } = useAuth()
  
  interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    nationalId: string;
    emergencyContact: string;
    emergencyPhone: string;
    temporaryPassword: string;
    subjects: string[];
    grades: string[];
    status: "active" | "inactive";
  }

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    nationalId: "",
    emergencyContact: "",
    emergencyPhone: "",
    temporaryPassword: "",
    subjects: [],
    grades: [],
    status: "active",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [copied, setCopied] = useState(false)
  const [searchSubject, setSearchSubject] = useState('')
  const [searchGrade, setSearchGrade] = useState('')
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  
  // Define available subjects
  const availableSubjects = {
    'Preescolar': [
      "Destrezas de Aprendizaje",
      "Comunicación y Lenguaje",
      "Medio Social y Natural",
      "Expresión Artística",
      "Educación Física",
      "Formación Ciudadana",
      "Tecnología"
    ],
    'Primaria Baja (1°-3°)': [
      "Comunicación y Lenguaje",
      "Matemáticas",
      "Medio Social y Natural",
      "Expresión Artística",
      "Educación Física",
      "Formación Ciudadana",
      "Tecnología"
    ],
    'Primaria Alta (4°-6°)': [
      "Comunicación y Lenguaje",
      "Matemáticas",
      "Ciencias Naturales",
      "Ciencias Sociales",
      "Expresión Artística",
      "Educación Física",
      "Formación Ciudadana",
      "Tecnología"
    ],
    'Básicos (1°-2°)': [
      "Comunicación y Lenguaje",
      "Matemáticas",
      "Ciencias Naturales",
      "Ciencias Sociales",
      "Expresión Artística",
      "Educación Física",
      "Formación Ciudadana",
      "Tecnología",
      "Inglés"
    ],
    '3° Básico': [
      "Comunicación y Lenguaje",
      "Matemáticas",
      "Ciencias Naturales",
      "Física",
      "Química",
      "Biología",
      "Ciencias Sociales",
      "Expresión Artística",
      "Educación Física",
      "Formación Ciudadana",
      "Tecnología",
      "Inglés"
    ],
    'Bachillerato en Ciencias y Letras': [
      "Lengua y Literatura",
      "Matemáticas",
      "Física",
      "Química",
      "Biología",
      "Ciencias Sociales",
      "Filosofía",
      "Psicología",
      "Educación Física",
      "Tecnología",
      "Inglés"
    ],
    'Perito Contador': [
      "Contabilidad General",
      "Contabilidad de Sociedades",
      "Contabilidad de Costos",
      "Legislación Mercantil",
      "Legislación Laboral",
      "Legislación Tributaria",
      "Auditoría",
      "Informática Aplicada",
      "Matemática Financiera",
      "Estadística",
      "Ética Profesional",
      "Práctica Supervisada",
      "Fundamentos de Administración",
      "Fundamentos de Economía",
      "Fundamentos de Derecho",
      "Inglés Comercial",
      "Redacción y Correspondencia Mercantil",
      "Introducción a la Economía",
      "Ortografía y Caligrafía",
      "Administración y Organización de OFICINA",
      "Computación",
      "Programación",
      "Matemática Básica",
      "Física",
      "Métodos de la Investigación",
      "Cálculo Mercantil y Financiero",
      "Legislación Fiscal y Aduanera",
      "Finanzas Públicas",
      "Geografía Económica",
      "Catalogación y Archivo",
      "Mecanografía",
      "Gestión de Proyectos",
      "Contabilidad Bancaria",
      "Contabilidad Gubernamental",
      "Estadística Comercial",
      "Organización de Empresas",
      "Ética Profesional y R.H",
      "Derecho Mercantil y N.D.L"
    ]
  };

  // Function to get subjects based on selected grades
  const getFilteredSubjects = () => {
    if (selectedGrades.length === 0) return {};
    
    const gradeLevels = selectedGrades.map(grade => {
      if (grade.includes('Nursery') || grade.includes('Prekinder') || grade.includes('Kinder') || grade.includes('Preparatoria')) {
        return 'Preescolar';
      } else if (grade.includes('Primaria')) {
        const gradeNum = parseInt(grade.split('°')[0]);
        return gradeNum <= 3 ? 'Primaria Baja (1°-3°)' : 'Primaria Alta (4°-6°)';
      } else if (grade.includes('Básico')) {
        const gradeNum = parseInt(grade.split('°')[0]);
        return gradeNum === 3 ? '3° Básico' : 'Básicos (1°-2°)';
      } else if (grade.includes('Bachillerato')) {
        return 'Bachillerato en Ciencias y Letras';
      } else if (grade.includes('Perito')) {
        return 'Perito Contador';
      }
      return '';
    });
    
    // Get unique subject categories
    const uniqueCategories = [...new Set(gradeLevels)];
    
    // Combine subjects from all relevant categories
    const filteredSubjects: Record<string, string[]> = {};
    uniqueCategories.forEach(category => {
      if (availableSubjects[category as keyof typeof availableSubjects]) {
        filteredSubjects[category] = availableSubjects[category as keyof typeof availableSubjects];
      }
    });
    
    return filteredSubjects;
  };
  
  const filteredSubjects = getFilteredSubjects();
  
  // Helper function to get regular subjects for selected grades
  const getRegularSubjectsForGrades = (grades: string[]): string[] => {
    const subjects = new Set<string>();
    
    grades.forEach(grade => {
      // Map grades to their subject categories
      let category = '';
      
      if (grade.includes('Nursery') || grade.includes('Prekinder') || 
          grade.includes('Kinder') || grade.includes('Preparatoria')) {
        category = 'Preescolar';
      } else if (grade.includes('1° Primaria') || grade.includes('2° Primaria') || grade.includes('3° Primaria')) {
        category = 'Primaria Baja (1°-3°)';
      } else if (grade.includes('4° Primaria') || grade.includes('5° Primaria') || grade.includes('6° Primaria')) {
        category = 'Primaria Alta (4°-6°)';
      } else if (grade.includes('1° Básico') || grade.includes('2° Básico')) {
        category = 'Básicos (1°-2°)';
      } else if (grade.includes('3° Básico')) {
        category = '3° Básico';
      } else if (grade.includes('Bachillerato en Ciencias y Letras')) {
        category = 'Bachillerato en Ciencias y Letras';
      } else if (grade.includes('Perito Contador')) {
        category = 'Perito Contador';
      }
      
      // Add subjects from the category
      if (category && availableSubjects[category as keyof typeof availableSubjects]) {
        availableSubjects[category as keyof typeof availableSubjects].forEach(subject => {
          subjects.add(subject);
        });
      }
    });
    
    return Array.from(subjects);
  };

  const handleGradeChange = (grade: string, checked: boolean) => {
    const newSelectedGrades = checked
      ? [...selectedGrades, grade]
      : selectedGrades.filter(g => g !== grade);
    
    setSelectedGrades(newSelectedGrades);
    
    // Update form data with the new grades
    setFormData(prev => ({
      ...prev,
      grades: newSelectedGrades
    }));
  };

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: checked
        ? [...prev.subjects, subject]
        : prev.subjects.filter(s => s !== subject)
    }));
  }

  // Handle grade selection

  const toggleAllGrades = (grades: string[], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      grades: checked
        ? [...new Set([...prev.grades, ...grades])]
        : prev.grades.filter(g => !grades.includes(g))
    }))
  }

  const isAllGradesInCategorySelected = (grades: string[]) => {
    return grades.every(grade => formData.grades.includes(grade))
  }

  const generateTemporaryPassword = (): string => {
    return '123456' // Contraseña simple por defecto
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err)
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = '123456' // Contraseña fija
    setTemporaryPassword(newPassword)
    setFormData(prev => ({ ...prev, temporaryPassword: newPassword }))
    toast.success('Contraseña temporal establecida')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    if (!token) {
      toast.error("No estás autenticado. Por favor inicia sesión nuevamente.")
      router.push('/login')
      return
    }

    if (user?.rol?.toUpperCase() !== 'ADMIN') {
      toast.error("No tienes permisos para realizar esta acción")
      setIsSubmitting(false)
      return
    }

    try {
      // Obtener la contraseña del estado del formulario o generar una nueva
      const passwordToUse = formData.temporaryPassword || generateTemporaryPassword()
      
      // Actualizar el estado con la contraseña si no estaba establecida
      if (!formData.temporaryPassword) {
        setFormData(prev => ({ ...prev, temporaryPassword: passwordToUse }))
        setTemporaryPassword(passwordToUse)
      }

      // Preparar los datos para enviar al backend
      const requestData = {
        nombre: formData.firstName.trim(),
        apellido: formData.lastName.trim(),
        email: formData.email.trim(),
        password: passwordToUse, // Usar el valor real de la contraseña
        rol: 'DOCENTE',
        telefono: formData.phone?.trim() || null,
        direccion: formData.address?.trim() || null,
        fechaNacimiento: formData.dateOfBirth || null,
        dni: formData.nationalId?.trim() || null,
        contactoEmergencia: formData.emergencyContact?.trim() || null,
        telefonoEmergencia: formData.emergencyPhone?.trim() || null,
        requiresPasswordChange: true,
        activo: formData.status === 'active',
        materias: Array.isArray(formData.subjects) ? formData.subjects : [],
        grados: Array.isArray(formData.grades) ? formData.grades : []
      }

      // Log para depuración (sin contraseña)
      console.log('Enviando datos al servidor:', {
        ...requestData,
        password: '***'
      });

      // Log con los datos reales (solo para depuración)
      console.log('Datos reales que se enviarán:', JSON.stringify({
        ...requestData,
        password: passwordToUse
      }, null, 2));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register/teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requestData,
          password: passwordToUse // Asegurar que la contraseña se envíe correctamente
        })
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error('Error en la respuesta del servidor:', responseData)
        throw new Error(responseData.message || 'Error al registrar el docente')
      }

      setSubmitStatus("success")
      setTemporaryPassword(passwordToUse)
      
      // Mostrar mensaje de éxito
      toast.success("Docente registrado exitosamente")
      
      // Desplazarse al mensaje de éxito
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Opcional: Limpiar el formulario después de un registro exitoso
      // setFormData({
      //   firstName: "",
      //   lastName: "",
      //   email: "",
      //   // ...resto de campos
      // })

    } catch (err) {
      console.error("Error en el registro:", err)
      setSubmitStatus("error")
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar el docente'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/teachers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nuevo Docente</h1>
              <p className="text-sm text-gray-600">Registrar un nuevo profesor en el sistema</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Datos básicos del docente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="temporaryPassword">Contraseña Temporal *</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-6 px-2"
                      onClick={handleGeneratePassword}
                    >
                      Generar
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="temporaryPassword"
                      type="text"
                      value={formData.temporaryPassword || temporaryPassword || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData(prev => ({ ...prev, temporaryPassword: value }))
                        setTemporaryPassword(value)
                      }}
                      placeholder="Haz clic en Generar o escribe una contraseña"
                      required
                      className="pr-10"
                    />
                    {formData.temporaryPassword && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formData.temporaryPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        title="Copiar contraseña"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    El docente deberá cambiar esta contraseña en su primer inicio de sesión.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationalId">DPI/Cédula</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto de Emergencia</CardTitle>
              <CardDescription>Información de contacto en caso de emergencia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Nombre del Contacto</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Asignaciones Académicas */}
          <Card>
            <CardHeader>
              <CardTitle>Asignaciones Académicas</CardTitle>
              <CardDescription>Seleccione primero los grados y luego las materias correspondientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grados Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Grados asignados</Label>
                    <div className="relative w-64">
                      <Input
                        type="text"
                        placeholder="Buscar grados..."
                        value={searchGrade}
                        onChange={(e) => setSearchGrade(e.target.value)}
                        className="h-8 text-sm"
                      />
                      {searchGrade && (
                        <button 
                          onClick={() => setSearchGrade('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-3 border rounded-md">
                    {Object.entries(availableGrades).map(([level, grades]) => {
                      const filteredGrades = grades.filter(grade => 
                        grade.toLowerCase().includes(searchGrade.toLowerCase())
                      )
                      
                      if (filteredGrades.length === 0) return null
                      
                      const allSelected = isAllGradesInCategorySelected(grades)
                      
                      return (
                        <div key={level} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700">{level}</h4>
                            <button
                              type="button"
                              onClick={() => toggleAllGrades(grades, !allSelected)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1 pl-2">
                            {filteredGrades.map((grade) => (
                              <div key={grade} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`grade-${grade}`}
                                  checked={selectedGrades.includes(grade)}
                                  onCheckedChange={(checked) =>
                                    handleGradeChange(grade, checked as boolean)
                                  }
                                />
                                <Label htmlFor={`grade-${grade}`} className="text-sm font-normal">
                                  {grade}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Materias Section - Only show if grades are selected */}
              {selectedGrades.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Materias que imparte</Label>
                    <div className="relative w-64">
                      <Input
                        type="text"
                        placeholder="Buscar materias..."
                        value={searchSubject}
                        onChange={(e) => setSearchSubject(e.target.value)}
                        className="h-8 text-sm"
                        disabled={selectedGrades.length === 0}
                      />
                      {searchSubject && (
                        <button 
                          onClick={() => setSearchSubject('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-3 border rounded-md">
                    {Object.entries(filteredSubjects).length > 0 ? (
                      Object.entries(filteredSubjects).map(([category, subjects]) => {
                        const filteredCategorySubjects = subjects.filter(subject => 
                          subject.toLowerCase().includes(searchSubject.toLowerCase())
                        )
                        
                        if (filteredCategorySubjects.length === 0) return null
                        
                        return (
                          <div key={category} className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">{category}</h4>
                            <div className="space-y-1 pl-2">
                              {filteredCategorySubjects.map((subject) => (
                                <div key={subject} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`subject-${subject}`}
                                    checked={formData.subjects.includes(subject)}
                                    onCheckedChange={(checked) =>
                                      handleSubjectChange(subject, checked as boolean)
                                    }
                                    disabled={Object.values(extracurricularSubjects).flat().includes(subject)}
                                  />
                                  <Label 
                                    htmlFor={`subject-${subject}`} 
                                    className={`text-sm font-normal ${
                                      Object.values(extracurricularSubjects).flat().includes(subject) ? 'text-muted-foreground' : ''
                                    }`}
                                  >
                                    {subject}
                                    {Object.values(extracurricularSubjects).flat().includes(subject) && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        (Asignada automáticamente)
                                      </span>
                                    )}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-2 text-center text-sm text-gray-500 py-4">
                        No hay materias disponibles para los grados seleccionados
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Section */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Docente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({...formData, status: value as "active" | "inactive"})}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/teachers">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrar Docente
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
