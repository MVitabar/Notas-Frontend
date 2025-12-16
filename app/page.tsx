// app/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, GraduationCap, FileSpreadsheet } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const result = await login(email, password)
      
      if (!result.success) {
        setError(result.error || "Error de autenticación")
        return
      }

      toast.success("¡Sesión iniciada correctamente!")
      
      // Redirigir según el rol y si requiere cambio de contraseña
      if (result.requiresPasswordChange) {
        router.push("/change-password")
        return
      }
      
      const userRole = result.user?.rol?.toUpperCase()
      if (userRole === "ADMIN") {
        router.push("/admin")
      } else if (userRole === "DOCENTE") {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("Error de red o del servidor")
      toast.error("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Liceo Cristiano Zacapaneco</h1>
              <p className="text-sm text-gray-600">Sistema de Control de Notas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>Accede al sistema de gestión de notas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="docente@liceozacapaneco.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Ingresando..." : "Ingresar al Sistema"}
                </Button>

                <div className="text-center mt-4 text-sm">
                  <span className="text-gray-600">¿No tienes una cuenta? </span>
                  <Link 
                    href="/register" 
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Regístrate aquí
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          
        </div>
      </div>
    </div>
  )
}