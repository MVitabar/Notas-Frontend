"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, UserPlus, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { extracurricularSubjects, availableGrades, regularSubjects } from "@/lib/data/academicData"

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  dni: string;
  phone: string;
  email: string;
  grade: string;
  emergencyContact: string;
  emergencyPhone: string;
  address: string;
  status: string;
  materiasRegulares: string[];
  materiasExtracurriculares: string[];
}

export default function NewStudentPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    dni: "",
    phone: "",
    email: "",
    grade: "",
    emergencyContact: "",
    emergencyPhone: "",
    address: "",
    status: "active",
    materiasRegulares: [],
    materiasExtracurriculares: []
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Usamos availableGrades importado de academicData

const generateStudentCode = () => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `${year}${randomNum}`
  }

  const handleGradeChange = (grade: string) => {
    // Obtener las materias regulares del grado seleccionado
    const materiasRegulares = regularSubjects[grade as keyof typeof regularSubjects] || [];
    
    // Obtener las materias extracurriculares del grado seleccionado
    const materiasExtracurriculares = extracurricularSubjects[grade as keyof typeof extracurricularSubjects] || [];
    
    // Actualizar el estado
    setFormData(prev => ({
      ...prev,
      grade,
      materiasRegulares,
      materiasExtracurriculares
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    // Validar campos requeridos
    const requiredFields = {
      firstName: 'El nombre es obligatorio',
      lastName: 'El apellido es obligatorio',
      dni: 'El DNI es obligatorio',
      dateOfBirth: 'La fecha de nacimiento es obligatoria',
      grade: 'El grado es obligatorio',
      address: 'La dirección es obligatoria'
    }

    const newErrors: Record<string, string> = {}
    
    // Verificar campos requeridos
    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = message
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSubmitStatus("error")
      setIsSubmitting(false)
      return
    }

    // Limpiar errores si la validación es exitosa
    setErrors({})

    try {
      // Format data according to Prisma schema
      const studentData = {
        nombre: formData.firstName.trim(),
        apellido: formData.lastName.trim(),
        fechaNacimiento: new Date(formData.dateOfBirth).toISOString(),
        dni: formData.dni.trim(),
        telefono: formData.phone.trim() || null,
        direccion: formData.address.trim(),
        contactoEmergencia: formData.emergencyContact.trim() || null,
        telefonoEmergencia: formData.emergencyPhone.trim() || null,
        email: formData.email.trim() || null,
        activo: formData.status === 'active',
        grados: formData.grade ? [formData.grade] : [],
        materias: [
          ...formData.materiasRegulares,
          ...formData.materiasExtracurriculares
        ]
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(studentData)
      })

      if (!response.ok) {
        let errorMessage = 'Error al crear el estudiante'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.error('Error parsing error response:', e)
        }
        throw new Error(errorMessage)
      }

      setSubmitStatus("success")

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          dni: "",
          phone: "",
          email: "",
          grade: "",
          emergencyContact: "",
          emergencyPhone: "",
          address: "",
          status: "active",
          materiasRegulares: [],
          materiasExtracurriculares: []
        });
        setSubmitStatus("idle");
      }, 2000)

    } catch (error) {
      console.error('Error creating student:', error)
      setSubmitStatus("error")
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
            <Link href="/admin/students">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nuevo Estudiante</h1>
              <p className="text-sm text-gray-600">Inscribir un nuevo estudiante en el sistema</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información del Estudiante */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Estudiante</CardTitle>
              <CardDescription>Datos básicos del estudiante</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombres *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value });
                      if (errors.firstName) {
                        setErrors(prev => ({
                          ...prev,
                          firstName: ''
                        }));
                      }
                    }}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value });
                      if (errors.lastName) {
                        setErrors(prev => ({
                          ...prev,
                          lastName: ''
                        }));
                      }
                    }}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Fecha de Nacimiento *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      setFormData({ ...formData, dateOfBirth: e.target.value });
                      if (errors.dateOfBirth) {
                        setErrors(prev => ({
                          ...prev,
                          dateOfBirth: ''
                        }));
                      }
                    }}
                    className={errors.dateOfBirth ? 'border-red-500' : ''}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI *</Label>
                  <Input
                    id="dni"
                    value={formData.dni}
                    onChange={(e) => {
                      setFormData({ ...formData, dni: e.target.value });
                      if (errors.dni) {
                        setErrors(prev => ({
                          ...prev,
                          dni: ''
                        }));
                      }
                    }}
                    className={errors.dni ? 'border-red-500' : ''}
                  />
                  {errors.dni && (
                    <p className="mt-1 text-sm text-red-500">{errors.dni}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grado *</Label>
                <Select 
                  value={formData.grade} 
                  onValueChange={(value) => {
                    handleGradeChange(value);
                    if (errors.grade) {
                      setErrors(prev => ({
                        ...prev,
                        grade: ''
                      }));
                    }
                  }}
                >
                  <SelectTrigger className={errors.grade ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(availableGrades).map(([nivel, grados]) => (
                      <div key={nivel}>
                        <div className="px-2 py-1 text-sm font-semibold text-gray-500 bg-gray-100">
                          {nivel}
                        </div>
                        {(grados as string[]).map((grado) => (
                          <SelectItem key={grado} value={grado}>
                            {grado}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                {/* Mostrar materias asignadas */}
                {formData.grade && (formData.materiasRegulares.length > 0 || formData.materiasExtracurriculares.length > 0) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-3">Materias asignadas:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Columna de materias regulares */}
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Materias Regulares</h4>
                        <ul className="space-y-1">
                          {formData.materiasRegulares.map((materia, index) => (
                            <li key={`regular-${index}`} className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span className="text-sm">{materia}</span>
                            </li>
                          ))}
                          {formData.materiasRegulares.length === 0 && (
                            <li className="text-sm text-gray-500 italic">No hay materias regulares</li>
                          )}
                        </ul>
                      </div>
                      
                      {/* Columna de materias extracurriculares */}
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Materias Extracurriculares</h4>
                        <ul className="space-y-1">
                          {formData.materiasExtracurriculares.map((materia, index) => (
                            <li key={`extra-${index}`} className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                              <span className="text-sm">{materia}</span>
                            </li>
                          ))}
                          {formData.materiasExtracurriculares.length === 0 && (
                            <li className="text-sm text-gray-500 italic">No hay materias extracurriculares</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    // Limpiar el error cuando el usuario comienza a escribir
                    if (errors.address) {
                      setErrors(prev => ({
                        ...prev,
                        address: ''
                      }));
                    }
                  }}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contacto de Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto de Emergencia</CardTitle>
              <CardDescription>Información de contacto alternativo</CardDescription>
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

{/* Estado del Estudiante */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Estudiante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Estado Inicial</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Status Messages */}
          {submitStatus === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Estudiante inscrito exitosamente!
              </AlertDescription>
            </Alert>
          )}

          {submitStatus === "error" && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Error al inscribir el estudiante. Por favor, verifica que todos los campos requeridos estén completos.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/students">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Inscribiendo...</>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Inscribir Estudiante
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
