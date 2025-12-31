import { PDFDownloadLink } from '@react-pdf/renderer';
import { GradeReportPdf } from '@/components/GradeReportPdf';

export const generateGradeReportPdf = (studentData: any) => {
  return (
    <PDFDownloadLink
      document={
        <GradeReportPdf
          student={{
            nombre: studentData.nombre,
            grado: studentData.grado,
          }}
          materias={studentData.materias || []}
          extracurriculares_valorativas={studentData.extracurriculares_valorativas || []}
          responsabilidad_aprendizaje={studentData.responsabilidad_aprendizaje || []}
          responsabilidad_comportamiento={studentData.responsabilidad_comportamiento || []}
          habitos_casa={studentData.habitos_casa || []}
          promedios={{
            promedio_u1: studentData.promedios?.promedio_u1 || 0,
            promedio_u2: studentData.promedios?.promedio_u2 || 0,
            promedio_u3: studentData.promedios?.promedio_u3 || 0,
            promedio_u4: studentData.promedios?.promedio_u4 || 0,
          }}
        />
      }
      fileName={`boletin_${studentData.nombre.replace(/\s+/g, '_').toLowerCase()}.pdf`}
    >
      {({ blob, url, loading, error }) =>
        loading ? 'Generando PDF...' : 'Descargar PDF'
      }
    </PDFDownloadLink>
  );
};

export const generateGradeReportPdfButton = (studentData: any) => {
  return (
    <button 
      onClick={() => {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${btoa(JSON.stringify(studentData))}`;
        link.download = `boletin_${studentData.nombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;
        link.click();
      }}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Generar PDF
    </button>
  );
};
