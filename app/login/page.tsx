// app/login/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"

export default function LoginPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // If user is already logged in, redirect based on role
    if (user) {
      if (user.requiresPasswordChange) {
        router.push('/change-password')
      } else if (user.rol === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } else {
      // If not logged in, redirect to the main page which will handle the login
      router.replace("/")
    }
  }, [user, router])
  
  return null
}