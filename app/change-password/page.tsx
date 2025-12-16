"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [passwordRequirements, setPasswordRequirements] = useState({
        minLength: false,
        hasNumber: false,
        hasUppercase: false,
        hasLowercase: false,
        hasSpecialChar: false
    })

    const router = useRouter()
    const { user, updateSession, token: contextToken } = useAuth()
    const [tempToken, setTempToken] = useState<string | null>(null)

    // Verificar si hay un token temporal para cambio de contraseña
    useEffect(() => {
        const token = localStorage.getItem('tempToken')
        if (token) {
            setTempToken(token)
        } else if (!contextToken) {
            // Si no hay token ni token temporal, redirigir al login
            router.push('/login')
        }
    }, [contextToken, router])

    // Redirigir si el usuario ya cambió su contraseña
    useEffect(() => {
        if (user && !user.requiresPasswordChange && !tempToken) {
            const userRole = user.rol?.toUpperCase() || 'DOCENTE'
            const redirectPath = localStorage.getItem('redirectAfterPasswordChange') ||
                (userRole === 'ADMIN' ? '/admin' : '/dashboard')
            router.push(redirectPath)
        }
    }, [user, router, tempToken])

    const validatePassword = (password: string) => {
        const requirements = {
            minLength: password.length >= 8,
            hasNumber: /\d/.test(password),
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?:{}|<>]/.test(password)
        }
        setPasswordRequirements(requirements)
        return requirements
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        if (e.target.name === 'newPassword') {
            validatePassword(e.target.value)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validar que las contraseñas coincidan
        if (formData.newPassword !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden")
            return
        }

        // Validar la contraseña
        const validation = validatePassword(formData.newPassword)
        
        // Verificar si hay algún requisito sin cumplir
        const hasError = Object.values(validation).some(valid => !valid)
        if (hasError) {
            setError("Por favor cumpla con todos los requisitos de la contraseña")
            return
        }

        setIsSubmitting(true)
        setError("")

        try {
            // Usar el token temporal si existe, de lo contrario usar el token del contexto
            const authToken = tempToken || contextToken;
            
            if (!authToken) {
                throw new Error('No se pudo autenticar la solicitud')
            }

            // Crear el objeto de datos a enviar
            const requestData = {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            };

            console.log('Enviando datos al servidor:', {
                ...requestData,
                currentPassword: '***', // No mostrar la contraseña en los logs
                newPassword: '***',
                confirmPassword: '***'
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Error del servidor:', data);
                throw new Error(data.message || 'Error al cambiar la contraseña');
            }

            // Si venimos de un token temporal, actualizar el token en el localStorage
            if (tempToken) {
                localStorage.removeItem('tempToken');
                localStorage.setItem('token', tempToken);
            }

            // Actualizar la sesión para marcar que ya no requiere cambio de contraseña
            await updateSession({ requiresPasswordChange: false })

            // Obtener el rol del usuario para redirección
            const userRole = user?.rol?.toUpperCase() || 'DOCENTE'

            // Redirigir a la ruta guardada o al dashboard según el rol
            const redirectPath = localStorage.getItem('redirectAfterPasswordChange') ||
                (userRole === 'ADMIN' ? '/admin' : '/dashboard')

            // Limpiar la ruta guardada
            localStorage.removeItem('redirectAfterPasswordChange')

            toast.success("¡Contraseña actualizada exitosamente!")
            setTimeout(() => {
                router.push(redirectPath)
            }, 2000)

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error al cambiar la contraseña"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
                    <div className="text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h2 className="mt-6 text-2xl font-bold text-gray-900">¡Contraseña actualizada!</h2>
                        <p className="mt-2 text-gray-600">Redirigiendo...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="mt-6 text-2xl font-bold text-gray-900">
                        Cambio de contraseña requerido
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Por seguridad, debes cambiar tu contraseña antes de continuar.
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="currentPassword">Contraseña actual</Label>
                            <PasswordInput
                                id="currentPassword"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                required
                                className="mt-1"
                                autoComplete="current-password"
                            />
                        </div>

                        <div>
                            <Label htmlFor="newPassword">Nueva contraseña</Label>
                            <PasswordInput
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                required
                                minLength={8}
                                className="mt-1"
                                autoComplete="new-password"
                            />
                            <div className="mt-2 text-xs text-gray-600 space-y-1">
                                <p className={passwordRequirements.minLength ? "text-green-600" : ""}>
                                    - Mínimo 8 caracteres
                                </p>
                                <p className={passwordRequirements.hasNumber ? "text-green-600" : ""}>
                                    - Al menos un número
                                </p>
                                <p className={passwordRequirements.hasUppercase ? "text-green-600" : ""}>
                                    - Al menos una letra mayúscula
                                </p>
                                <p className={passwordRequirements.hasLowercase ? "text-green-600" : ""}>
                                    - Al menos una letra minúscula
                                </p>
                                <p className={passwordRequirements.hasSpecialChar ? "text-green-600" : ""}>
                                    - Al menos un carácter especial (!@#$%^&*)
                                </p>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                            <PasswordInput
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                                className="mt-1"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                "Cambiar contraseña"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}