import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Token de autorización requerido" }, { status: 401 })
    }

    // Simular obtención de hojas de cálculo desde Google Drive API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const mockSheets = [
      {
        id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
        name: "Notas Primer Bimestre 2024",
        url: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
        lastModified: "2024-03-15T10:30:00Z",
        sheets: ["1° Primaria", "2° Primaria", "3° Básico", "Resumen"],
        owner: "profesor@liceozacapaneco.edu",
        permissions: "edit",
      },
      {
        id: "1234567890abcdef",
        name: "Evaluaciones Matemáticas",
        url: "https://docs.google.com/spreadsheets/d/1234567890abcdef",
        lastModified: "2024-03-10T14:20:00Z",
        sheets: ["Examen 1", "Examen 2", "Tareas", "Promedios"],
        owner: "matematicas@liceozacapaneco.edu",
        permissions: "view",
      },
      {
        id: "abcdef1234567890",
        name: "Registro de Estudiantes 2024",
        url: "https://docs.google.com/spreadsheets/d/abcdef1234567890",
        lastModified: "2024-02-28T09:15:00Z",
        sheets: ["Primaria", "Básico", "Diversificado", "Estadísticas"],
        owner: "admin@liceozacapaneco.edu",
        permissions: "edit",
      },
      {
        id: "xyz789abc123",
        name: "Asistencia Mensual",
        url: "https://docs.google.com/spreadsheets/d/xyz789abc123",
        lastModified: "2024-03-12T16:45:00Z",
        sheets: ["Enero", "Febrero", "Marzo", "Resumen"],
        owner: "asistencia@liceozacapaneco.edu",
        permissions: "edit",
      },
    ]

    return NextResponse.json({
      success: true,
      sheets: mockSheets,
      totalCount: mockSheets.length,
    })
  } catch (error) {
    console.error("Error obteniendo hojas de Google:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
