"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye } from "lucide-react"

interface SheetPreviewProps {
  data: {
    headers: string[]
    rows: string[][]
    totalRows: number
  }
  mappings: Array<{
    sheetColumn: string
    systemField: string
    required: boolean
  }>
  maxRows?: number
}

export function SheetPreview({ data, mappings, maxRows = 5 }: SheetPreviewProps) {
  const previewRows = data.rows.slice(0, maxRows)

  const getSystemFieldLabel = (systemField: string) => {
    const fieldLabels: Record<string, string> = {
      studentName: "Nombre",
      studentCode: "Código",
      grade: "Nota",
      observations: "Observaciones",
      evaluationDate: "Fecha",
      evaluationType: "Tipo",
    }
    return fieldLabels[systemField] || systemField
  }

  const getMappedValue = (row: string[], sheetColumn: string) => {
    const columnIndex = data.headers.indexOf(sheetColumn)
    return columnIndex !== -1 ? row[columnIndex] : "-"
  }

  const getGradeBadgeVariant = (value: string) => {
    const numValue = Number.parseFloat(value)
    if (isNaN(numValue)) return "outline"
    if (numValue >= 90) return "default"
    if (numValue >= 80) return "secondary"
    return "outline"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Vista Previa de Datos
        </CardTitle>
        <CardDescription>
          Mostrando {previewRows.length} de {data.totalRows} filas con el mapeo aplicado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {mappings.map((mapping, index) => (
                  <TableHead key={index}>
                    <div className="space-y-1">
                      <div className="font-medium">{getSystemFieldLabel(mapping.systemField)}</div>
                      <div className="text-xs text-gray-500">← {mapping.sheetColumn}</div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {mappings.map((mapping, colIndex) => {
                    const value = getMappedValue(row, mapping.sheetColumn)
                    return (
                      <TableCell key={colIndex}>
                        {mapping.systemField === "grade" && value !== "-" ? (
                          <Badge variant={getGradeBadgeVariant(value)}>{value}</Badge>
                        ) : mapping.systemField === "studentCode" && value !== "-" ? (
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">{value}</code>
                        ) : (
                          <span className={value === "-" ? "text-gray-400" : ""}>{value}</span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.totalRows > maxRows && (
          <div className="mt-3 text-center text-sm text-gray-600">... y {data.totalRows - maxRows} filas más</div>
        )}
      </CardContent>
    </Card>
  )
}
