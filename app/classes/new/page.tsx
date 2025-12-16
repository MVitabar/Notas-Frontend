"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Plus, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function NewClassPage() {
  const [formData, setFormData] = useState({
    teacher: "",
    grade: "",
    subject: "",
    academicYear: "2024",
    semester: "1",
    schedule: "",
    classroom: "",
    maxStudents: "30",
    description: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const teachers = [
    { id: "1", name: "Prof. Juan Pérez", email: "juan.perez@liceozacapaneco.edu" },
    { id: "2", name: "Prof. María González", email: "maria.gonzalez@liceozacapaneco.edu" },
    { id: "3", name: "Prof. Carlos Rodríguez", email: "carlos.rodriguez@liceozacapaneco.edu" },
    { id: "4", name: "Prof. Ana López", email: "ana.lopez@liceozacapaneco.edu" },
    { id: "5", name: "Prof. José Martínez", email: "jose.martinez@liceozacapaneco.edu" },
  ]

  const grades = [
    { level: "Preescolar", grades: ["Preescolar"] },
    {
      level: "Primaria",
      grades: ["1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria"],
    },
    { level: "Básico", grades: ["1° Básico", "2° Básico", "3° Básico"] },
    { level: "Diversificado", grades: ["4° Diversificado", "5° Diversificado"] },
  ]

  const subjects = [
    "Matemáticas",
    "Español",
    "Ciencias Naturales",
    "Estudios Sociales",
    "Inglés",
    "Educación Física",
    "Arte",
    "Música",
    "Religión",
    "Física",
    "Química",
    "Biología",
    "Literatura",
    "Filosofía",
    "Contabilidad",
  ]

  const schedules = [
    "Lunes 7:00-8:00",
    "Lunes 8:00-9:00",
    "Lunes 9:00-10:00",
    "Lunes 10:30-11:30",
    "Martes 7:00-8:00",
    "Martes 8:00-9:00",
    "Martes 9:00-10:00",
    "Martes 10:30-11:30",
    "Miércoles 7:00-8:00",
    "Miércoles 8:00-9:00",
    "Miércoles 9:00-10:00",
    "Miércoles 10:30-11:30",
    "Jueves 7:00-8:00",
    "Jueves 8:00-9:00",
    "Jueves 9:00-10:00",
    "Jueves 10:30-11:30",
    "Viernes 7:00-8:00",
    "Viernes 8:00-9:00",
    "Viernes 9:00-10:00",
    "Viernes 10:30-11:30",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validar campos requeridos
    if (!formData.teacher || !formData.grade || !formData.subject) {
      setSubmitStatus("error")
      setIsSubmitting(false)
      return
    }

    try {
      // Simular creación de clase
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSubmitStatus("success")

      // Limpiar formulario después de éxito
      setTimeout(() => {
        setFormData({
          teacher: "",
          grade: "",
          subject: "",
          academicYear: "2024",
          semester: "1",
          schedule: "",
          classroom: "",
          maxStudents: "30",
          description: "",
        })
        setSubmitStatus("idle")
      }, 3000)
    } catch (error) {
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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Nueva Clase</h1>
              <p className="text-sm text-gray-600">Crear una nueva asignación de clase</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Configura los datos principales de la clase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="teacher">Docente *</Label>
                  <Select
                    value={formData.teacher}
                    onValueChange={(value) => setFormData({ ...formData, teacher: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar docente" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          <div>
                            <div className="font-medium">{teacher.name}</div>
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade">Grado *</Label>
                  <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar grado" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((level) => (
                        <div key={level.level}>
                          <div className="px-2 py-1 text-sm font-semibold text-gray-500 bg-gray-100">{level.level}</div>
                          {level.grades.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Materia *</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Horario</Label>
                  <Select
                    value={formData.schedule}
                    onValueChange={(value) => setFormData({ ...formData, schedule: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar horario" />
                    </SelectTrigger>
                    <SelectContent>
                      {schedules.map((schedule) => (
                        <SelectItem key={schedule} value={schedule}>
                          {schedule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuración Académica */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración Académica</CardTitle>
              <CardDescription>Detalles del período académico y aula</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Año Académico</Label>
                  <Select
                    value={formData.academicYear}
                    onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semestre</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => setFormData({ ...formData, semester: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Primer Semestre</SelectItem>
                      <SelectItem value="2">Segundo Semestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classroom">Aula</Label>
                  <Input
                    id="classroom"
                    placeholder="Ej: Aula 101"
                    value={formData.classroom}
                    onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Máximo de Estudiantes</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción adicional de la clase..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Messages */}
          {submitStatus === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Clase creada exitosamente! Se ha asignado al docente seleccionado.
              </AlertDescription>
            </Alert>
          )}

          {submitStatus === "error" && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Error al crear la clase. Por favor, verifica que todos los campos requeridos estén completos.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Creando...</>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Clase
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
