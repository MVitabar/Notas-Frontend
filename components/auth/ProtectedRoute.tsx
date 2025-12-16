"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./AuthProvider"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, token } = useAuth()
  const router = useRouter()
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    if (!loading && !user && !initialLoad) {
      router.replace("/")
    }
    setInitialLoad(false)
  }, [user, loading, router, initialLoad, token])

  if (loading || initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500">Verificando sesión...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
