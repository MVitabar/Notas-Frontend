"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface ConnectionStatusProps {
  isConnected: boolean
  onReconnect: () => void
  lastSync?: string
}

export function ConnectionStatus({ isConnected, onReconnect, lastSync }: ConnectionStatusProps) {
  const [timeAgo, setTimeAgo] = useState("")

  useEffect(() => {
    if (lastSync) {
      const updateTimeAgo = () => {
        const now = new Date()
        const syncTime = new Date(lastSync)
        const diffInMinutes = Math.floor((now.getTime() - syncTime.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) {
          setTimeAgo("hace un momento")
        } else if (diffInMinutes < 60) {
          setTimeAgo(`hace ${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""}`)
        } else {
          const diffInHours = Math.floor(diffInMinutes / 60)
          setTimeAgo(`hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`)
        }
      }

      updateTimeAgo()
      const interval = setInterval(updateTimeAgo, 60000) // Actualizar cada minuto

      return () => clearInterval(interval)
    }
  }, [lastSync])

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <Badge variant="default" className="bg-green-600">
              Conectado
            </Badge>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-red-600" />
            <Badge variant="destructive">Desconectado</Badge>
          </>
        )}
        {lastSync && <span className="text-sm text-gray-600">Última sincronización: {timeAgo}</span>}
      </div>

      <Button variant="outline" size="sm" onClick={onReconnect} disabled={!isConnected}>
        <RefreshCw className="h-4 w-4 mr-1" />
        Sincronizar
      </Button>
    </div>
  )
}
