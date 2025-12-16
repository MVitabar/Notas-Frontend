"use client"

interface PreescolarTemplateProps {
  student: {
    name: string
    code: string
    grade: string
    teacher: string
  }
  grades: Array<{
    subject: string
    grade: number
    observations: string
  }>
  period: string
}

export function PreescolarTemplate({ student, grades, period }: PreescolarTemplateProps) {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-blue-500 pb-4">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">LICEO CRISTIANO ZACAPANECO</h1>
        <p className="text-lg text-gray-700">Reporte de Evaluación - Preescolar</p>
        <p className="text-sm text-gray-600">{period}</p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex">
            <span className="font-semibold w-24">Nombre:</span>
            <span className="border-b border-gray-300 flex-1 pl-2">{student.name}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-24">Código:</span>
            <span className="border-b border-gray-300 flex-1 pl-2">{student.code}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex">
            <span className="font-semibold w-24">Grado:</span>
            <span className="border-b border-gray-300 flex-1 pl-2">{student.grade}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-24">Maestra:</span>
            <span className="border-b border-gray-300 flex-1 pl-2">{student.teacher}</span>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-center bg-blue-100 py-2">ÁREAS DE DESARROLLO</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-gray-300 p-3 text-left">Área</th>
              <th className="border border-gray-300 p-3 text-center w-24">Logro</th>
              <th className="border border-gray-300 p-3 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-3 font-medium">{grade.subject}</td>
                <td className="border border-gray-300 p-3 text-center">
                  <div
                    className={`inline-block px-3 py-1 rounded text-white text-sm ${
                      grade.grade >= 90
                        ? "bg-green-500"
                        : grade.grade >= 80
                          ? "bg-blue-500"
                          : grade.grade >= 70
                            ? "bg-yellow-500"
                            : "bg-red-500"
                    }`}
                  >
                    {grade.grade >= 90
                      ? "Excelente"
                      : grade.grade >= 80
                        ? "Muy Bueno"
                        : grade.grade >= 70
                          ? "Bueno"
                          : "En Proceso"}
                  </div>
                </td>
                <td className="border border-gray-300 p-3 text-sm">{grade.observations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-12 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="font-semibold">Maestra</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-16">
            <p className="font-semibold">Padre/Madre de Familia</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-8 text-xs text-gray-500">Generado el {new Date().toLocaleDateString("es-GT")}</div>
    </div>
  )
}
