"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  RefreshCw,
  Eye,
  LinkIcon,
  FileSpreadsheet,
  MapPin,
  Settings,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface GoogleSheet {
  id: string
  name: string
  url: string
  lastModified: string
  sheets: string[]
}

interface SheetData {
  headers: string[]
  rows: string[][]
  totalRows: number
}

interface ColumnMapping {
  sheetColumn: string
  systemField: string
  required: boolean
}

export default function UploadPage() {
  const searchParams = useSearchParams()
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [selectedBimester, setSelectedBimester] = useState(searchParams.get("bimester") || "1")
  const [selectedYear, setSelectedYear] = useState("2024")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "connecting" | "selecting" | "mapping" | "importing" | "success" | "error"
  >("idle")
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [availableSheets, setAvailableSheets] = useState<GoogleSheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null)
  const [selectedSheetTab, setSelectedSheetTab] = useState("")
  const [sheetData, setSheetData] = useState<SheetData | null>(null)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])

  const grades = [
    "Preescolar",
    "1° Primaria",
    "2° Primaria",
    "3° Primaria",
    "4° Primaria",
    "5° Primaria",
    "6° Primaria",
    "1° Básico",
    "2° Básico",
    "3° Básico",
    "4° Diversificado",
    "5° Diversificado",
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

  const systemFields = [
    { key: "studentName", label: "Nombre del Estudiante", required: true },
    { key: "studentCode", label: "Código/Carné", required: true },
    { key: "grade", label: "Nota (0-100)", required: true },
    { key: "observations", label: "Observaciones", required: false },
    { key: "evaluationDate", label: "Fecha de Evaluación", required: false },
    { key: "evaluationType", label: "Tipo de Evaluación", required: false },
  ]

  const bimesters = [
    { value: "1", label: "1° Bimestre", period: "Enero - Marzo" },
    { value: "2", label: "2° Bimestre", period: "Abril - Junio" },
    { value: "3", label: "3° Bimestre", period: "Julio - Septiembre" },
    { value: "4", label: "4° Bimestre", period: "Octubre - Diciembre" },
  ]

  // Simular conexión con Google Sheets API
  const connectToGoogle = async () => {
    setUploadStatus("connecting")
    setUploadProgress(20)

    // Simular autenticación
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsGoogleConnected(true)
    setUploadProgress(40)

    // Simular obtención de hojas de cálculo
    const mockSheets: GoogleSheet[] = [
      {
        id: "1",
        name: `Notas ${selectedBimester}° Bimestre 2024`,
        url: "https://docs.google.com/spreadsheets/d/abc123",
        lastModified: "2024-03-15",
        sheets: ["1° Primaria", "2° Primaria", "3° Básico", "Resumen"],
      },
      {
        id: "2",
        name: "Evaluaciones Matemáticas",
        url: "https://docs.google.com/spreadsheets/d/def456",
        lastModified: "2024-03-10",
        sheets: ["Examen 1", "Examen 2", "Tareas", "Promedios"],
      },
      {
        id: "3",
        name: "Registro de Estudiantes 2024",
        url: "https://docs.google.com/spreadsheets/d/ghi789",
        lastModified: "2024-02-28",
        sheets: ["Primaria", "Básico", "Diversificado"],
      },
    ]

    setAvailableSheets(mockSheets)
    setUploadProgress(60)
    setUploadStatus("selecting")
  }

  const selectSheet = async (sheet: GoogleSheet, tabName: string) => {
    setSelectedSheet(sheet)
    setSelectedSheetTab(tabName)
    setUploadStatus("mapping")
    setUploadProgress(70)

    // Simular obtención de datos de la hoja
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockData: SheetData = {
      headers: ["Nombre Completo", "Carné", "Nota Final", "Observaciones", "Fecha"],
      rows: [
        ["Ana María García", "2024001", "85", "Excelente participación", "15/03/2024"],
        ["Carlos Rodríguez", "2024002", "92", "Muy dedicado", "15/03/2024"],
        ["María José López", "2024003", "78", "Necesita refuerzo", "15/03/2024"],
        ["José Antonio Pérez", "2024004", "88", "Buen progreso", "15/03/2024"],
        ["Sofía Hernández", "2024005", "95", "Sobresaliente", "15/03/2024"],
      ],
      totalRows: 5,
    }

    setSheetData(mockData)

    // Mapeo automático sugerido
    const suggestedMappings: ColumnMapping[] = [
      { sheetColumn: "Nombre Completo", systemField: "studentName", required: true },
      { sheetColumn: "Carné", systemField: "studentCode", required: true },
      { sheetColumn: "Nota Final", systemField: "grade", required: true },
      { sheetColumn: "Observaciones", systemField: "observations", required: false },
      { sheetColumn: "Fecha", systemField: "evaluationDate", required: false },
    ]

    setColumnMappings(suggestedMappings)
    generatePreview(mockData, suggestedMappings)
    setUploadProgress(80)
  }

  const generatePreview = (data: SheetData, mappings: ColumnMapping[]) => {
    const preview = data.rows.slice(0, 3).map((row) => {
      const mappedRow: any = {}
      mappings.forEach((mapping) => {
        const columnIndex = data.headers.indexOf(mapping.sheetColumn)
        if (columnIndex !== -1) {
          mappedRow[mapping.systemField] = row[columnIndex]
        }
      })
      return mappedRow
    })
    setPreviewData(preview)
  }

  const updateColumnMapping = (index: number, systemField: string) => {
    const newMappings = [...columnMappings]
    newMappings[index].systemField = systemField
    setColumnMappings(newMappings)

    if (sheetData) {
      generatePreview(sheetData, newMappings)
    }
  }

  const importData = async () => {
    if (!selectedGrade || !selectedSubject || !selectedBimester) {
      alert("Por favor selecciona el grado, materia y bimestre antes de importar")
      return
    }

    setUploadStatus("importing")
    setUploadProgress(85)

    // Simular importación
    await new Promise((resolve) => setTimeout(resolve, 3000))

    setUploadProgress(100)
    setUploadStatus("success")
  }

  const resetProcess = () => {
    setUploadStatus("idle")
    setUploadProgress(0)
    setIsGoogleConnected(false)
    setAvailableSheets([])
    setSelectedSheet(null)
    setSelectedSheetTab("")
    setSheetData(null)
    setColumnMappings([])
    setPreviewData([])
  }

  const getCurrentBimesterInfo = () => {
    return bimesters.find((b) => b.value === selectedBimester)
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
              <h1 className="text-xl font-bold text-gray-900">Importar desde Google Sheets</h1>
              <p className="text-sm text-gray-600">Conecta y sincroniza datos desde Google Sheets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Bar */}
        {uploadStatus !== "idle" && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {uploadStatus === "connecting" && "Conectando con Google..."}
                  {uploadStatus === "selecting" && "Seleccionando hoja de cálculo..."}
                  {uploadStatus === "mapping" && "Mapeando columnas..."}
                  {uploadStatus === "importing" && "Importando datos..."}
                  {uploadStatus === "success" && "¡Importación completada!"}
                  {uploadStatus === "error" && "Error en la importación"}
                </span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paso 1: Configuración
                </CardTitle>
                <CardDescription>Selecciona el período académico y materia para la importación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Academic Period Selection */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Período Académico</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ciclo Escolar</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024">2024</SelectItem>
                          <SelectItem value="2023">2023</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Bimestre</Label>
                      <Select value={selectedBimester} onValueChange={setSelectedBimester}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bimesters.map((bimester) => (
                            <SelectItem key={bimester.value} value={bimester.value}>
                              <div>
                                <div className="font-medium">{bimester.label}</div>
                                <div className="text-xs text-gray-500">{bimester.period}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {getCurrentBimesterInfo() && (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <p className="text-sm">
                        <strong>Período seleccionado:</strong> {getCurrentBimesterInfo()?.label} (
                        {getCurrentBimesterInfo()?.period})
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grado</Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grado" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Materia</Label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Google Connection */}
            {uploadStatus === "idle" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Paso 2: Conectar con Google Sheets
                  </CardTitle>
                  <CardDescription>Autoriza el acceso a tus hojas de cálculo de Google</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Conectar con Google Sheets</h3>
                      <p className="text-gray-600 mb-4">
                        Accede a tus hojas de cálculo de Google Drive para importar datos del{" "}
                        {getCurrentBimesterInfo()?.label}
                      </p>
                    </div>
                    <Button onClick={connectToGoogle} size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Conectar con Google
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Sheet Selection */}
            {uploadStatus === "selecting" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Paso 3: Seleccionar Hoja de Cálculo
                  </CardTitle>
                  <CardDescription>
                    Elige la hoja de cálculo y pestaña que contiene los datos del {getCurrentBimesterInfo()?.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availableSheets.map((sheet) => (
                      <div key={sheet.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{sheet.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">
                              Última modificación: {new Date(sheet.lastModified).toLocaleDateString()}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {sheet.sheets.map((tabName) => (
                                <Badge key={tabName} variant="outline" className="text-xs">
                                  {tabName}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              {sheet.sheets.map((tabName) => (
                                <Button
                                  key={tabName}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => selectSheet(sheet, tabName)}
                                >
                                  Usar "{tabName}"
                                </Button>
                              ))}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={sheet.url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Column Mapping */}
            {uploadStatus === "mapping" && sheetData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Paso 4: Mapear Columnas
                  </CardTitle>
                  <CardDescription>Relaciona las columnas de tu hoja con los campos del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Hoja seleccionada:</strong> {selectedSheet?.name} → {selectedSheetTab}
                      </p>
                      <p className="text-sm text-blue-600">
                        {sheetData.totalRows} filas encontradas para {getCurrentBimesterInfo()?.label}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {columnMappings.map((mapping, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex-1">
                            <Label className="text-sm font-medium">Columna: "{mapping.sheetColumn}"</Label>
                            {mapping.required && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Requerido
                              </Badge>
                            )}
                          </div>
                          <div className="flex-1">
                            <Select
                              value={mapping.systemField}
                              onValueChange={(value) => updateColumnMapping(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar campo" />
                              </SelectTrigger>
                              <SelectContent>
                                {systemFields.map((field) => (
                                  <SelectItem key={field.key} value={field.key}>
                                    {field.label}
                                    {field.required && " *"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Preview */}
                    {previewData.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Vista Previa (primeras 3 filas)</h4>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Código</TableHead>
                                <TableHead>Nota</TableHead>
                                <TableHead>Observaciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewData.map((row, index) => (
                                <TableRow key={index}>
                                  <TableCell>{row.studentName || "-"}</TableCell>
                                  <TableCell>{row.studentCode || "-"}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={row.grade >= 90 ? "default" : row.grade >= 80 ? "secondary" : "outline"}
                                    >
                                      {row.grade || "-"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate">{row.observations || "-"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={resetProcess}>
                        Cancelar
                      </Button>
                      <Button onClick={importData}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar {sheetData.totalRows} Registros al {getCurrentBimesterInfo()?.label}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success/Error Messages */}
            {uploadStatus === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ¡Datos importados exitosamente! Se han procesado {sheetData?.totalRows} registros para {selectedGrade}{" "}
                  - {selectedSubject} ({getCurrentBimesterInfo()?.label}).
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Error al importar los datos. Por favor, verifica la conexión y el formato de los datos.
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === "success" && (
              <div className="flex justify-center gap-4">
                <Link href="/dashboard">
                  <Button variant="outline">Volver al Dashboard</Button>
                </Link>
                <Button onClick={resetProcess}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Importar Otra Hoja
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Period Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Período Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bimestre:</span>
                    <Badge variant="default">{getCurrentBimesterInfo()?.label}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Período:</span>
                    <span className="text-sm font-medium">{getCurrentBimesterInfo()?.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ciclo:</span>
                    <span className="text-sm font-medium">{selectedYear}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formato Requerido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p className="font-medium">Tu hoja debe contener:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Nombre del estudiante</li>
                    <li>Código o carné</li>
                    <li>Nota (0-100)</li>
                    <li>Observaciones (opcional)</li>
                  </ul>
                </div>

                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1example/template"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Ver Plantilla
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ventajas de Google Sheets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2 text-gray-600">
                  <p>• Sincronización en tiempo real</p>
                  <p>• Colaboración con otros docentes</p>
                  <p>• Acceso desde cualquier dispositivo</p>
                  <p>• Historial de cambios automático</p>
                  <p>• Fórmulas y validaciones avanzadas</p>
                  <p>• Organización por bimestres</p>
                </div>
              </CardContent>
            </Card>

            {isGoogleConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Conectado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>Conexión activa con Google Sheets</p>
                    <p className="mt-2">
                      <strong>{availableSheets.length}</strong> hojas disponibles
                    </p>
                    <p className="mt-1">
                      Importando para: <strong>{getCurrentBimesterInfo()?.label}</strong>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3 bg-transparent" onClick={resetProcess}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconectar
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
