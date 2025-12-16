import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { sheetId, sheetName, range } = await request.json()

    if (!sheetId || !sheetName) {
      return NextResponse.json({ error: "ID de hoja y nombre requeridos" }, { status: 400 })
    }

    // Simular obtención de datos desde Google Sheets API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Datos simulados basados en la hoja seleccionada
    const mockData = {
      "1° Primaria": {
        headers: ["Nombre Completo", "Carné", "Matemáticas", "Español", "Ciencias", "Promedio", "Observaciones"],
        rows: [
          ["Ana María García Pérez", "2024001", "85", "90", "88", "87.7", "Excelente participación en clase"],
          ["Carlos Eduardo Rodríguez", "2024002", "92", "89", "94", "91.7", "Muy dedicado y responsable"],
          ["María José López Hernández", "2024003", "78", "82", "75", "78.3", "Necesita refuerzo en matemáticas"],
          ["José Antonio Pérez Morales", "2024004", "88", "85", "90", "87.7", "Buen progreso general"],
          ["Sofía Isabella Hernández", "2024005", "95", "93", "97", "95.0", "Rendimiento sobresaliente"],
          ["Diego Alejandro Morales", "2024006", "82", "79", "85", "82.0", "Constante mejora"],
          ["Valentina García López", "2024007", "89", "91", "87", "89.0", "Muy buena comprensión"],
          ["Santiago Pérez Rodríguez", "2024008", "76", "80", "78", "78.0", "Requiere más práctica"],
        ],
      },
      "2° Primaria": {
        headers: ["Estudiante", "Código", "Nota Final", "Comportamiento", "Fecha Evaluación", "Comentarios"],
        rows: [
          ["Lucía Fernández Castro", "2024009", "91", "Excelente", "15/03/2024", "Liderazgo natural"],
          ["Mateo Vargas Jiménez", "2024010", "87", "Muy Bueno", "15/03/2024", "Colaborativo"],
          ["Isabella Moreno Díaz", "2024011", "93", "Excelente", "15/03/2024", "Creatividad destacada"],
          ["Emilio Castro Herrera", "2024012", "79", "Bueno", "15/03/2024", "Necesita motivación"],
          ["Camila Jiménez Soto", "2024013", "88", "Muy Bueno", "15/03/2024", "Progreso constante"],
        ],
      },
      "3° Básico": {
        headers: ["Nombre", "Carnet", "Ciencias Naturales", "Matemáticas", "Estudios Sociales", "Promedio", "Estado"],
        rows: [
          ["Andrea Paola Méndez", "2024014", "89", "92", "87", "89.3", "Aprobado"],
          ["Kevin Josué Ramírez", "2024015", "94", "96", "91", "93.7", "Aprobado"],
          ["Gabriela Sofía Ortega", "2024016", "86", "83", "89", "86.0", "Aprobado"],
          ["Bryan Alexander Flores", "2024017", "78", "75", "82", "78.3", "Aprobado"],
          ["Melissa Andrea Castillo", "2024018", "91", "89", "94", "91.3", "Aprobado"],
        ],
      },
    }

    const selectedData = mockData[sheetName as keyof typeof mockData] || {
      headers: ["Columna 1", "Columna 2", "Columna 3"],
      rows: [["Dato 1", "Dato 2", "Dato 3"]],
    }

    return NextResponse.json({
      success: true,
      data: {
        headers: selectedData.headers,
        rows: selectedData.rows,
        totalRows: selectedData.rows.length,
        range:
          range || `A1:${String.fromCharCode(65 + selectedData.headers.length - 1)}${selectedData.rows.length + 1}`,
        sheetInfo: {
          id: sheetId,
          name: sheetName,
          lastUpdated: new Date().toISOString(),
        },
      },
    })
  } catch (error) {
    console.error("Error obteniendo datos de la hoja:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
