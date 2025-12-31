'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.4,
    color: '#333',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: 120, // Adjust based on your header image aspect ratio
    marginBottom: 10,
  },
  footerImage: {
    width: '100%',
    height: 80, // Adjust based on your footer image aspect ratio
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  content: {
    padding: 20,
    paddingBottom: 100, // Make space for the footer
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#0056b3',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0056b3',
    margin: 0,
  },
  studentInfo: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#0056b3',
    paddingLeft: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#0056b3',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f9fbff',
    fontWeight: 'bold',
  },
  tableCell: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: '6px 8px',
    textAlign: 'center',
  },
  highlightRow: {
    backgroundColor: '#fff9c4',
  },
  footerNote: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
});

interface Student {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  grado: string;
  seccion: string;
  anio: string;
}

interface Materia {
  id: string;
  nombre_materia: string;
  u1: string | number;
  u2: string | number;
  u3: string | number;
  u4: string | number;
  final: string | number;
}

export interface EvaluacionExtracurricular {
  id: string;
  nombre: string;
  u1: string | number | null;
  u2: string | number | null;
  u3: string | number | null;
  u4: string | number | null;
  comentario?: string | null;
}

export interface Habito {
  id: string;
  nombre: string;
  u1: string | number | null;
  u2: string | number | null;
  u3: string | number | null;
  u4: string | number | null;
  comentario?: string | null;
}

interface GradeReportPdfProps {
  data: {
    estudiante: Student;
    materias: Materia[];
    extracurriculares_valorativas: EvaluacionExtracurricular[];
    responsabilidad_aprendizaje: Habito[];
    responsabilidad_comportamiento: Habito[];
    habitos_casa: Habito[];
    promedios: {
      u1: number;
      u2: number;
      u3: number;
      u4: number;
    };
  };
}

const GradeReportPdf = ({ data }: GradeReportPdfProps) => {
  const { estudiante, materias, promedios } = data;

  const renderStudentInfo = () => (
    <View style={styles.studentInfo}>
      <Text>
        <Text style={{ fontWeight: 'bold' }}>Nombre: </Text>
        {`${estudiante.nombre} ${estudiante.apellido}`}
      </Text>
      <Text>
        <Text style={{ fontWeight: 'bold' }}>Grado: </Text>
        {estudiante.grado}
      </Text>
    </View>
  );

  const renderTableHeader = (headers: string[]) => (
    <View style={[styles.tableRow, styles.tableHeader]}>
      {headers.map((header, index) => (
        <Text key={index} style={[styles.tableCell, { fontWeight: 'bold' }]}>
          {header}
        </Text>
      ))}
    </View>
  );

  const renderTableRow = (item: any, fields: string[], highlight = false) => (
    <View 
      key={item.id || item.nombre} 
      style={[
        styles.tableRow, 
        highlight ? { backgroundColor: '#fff9c4' } : {}
      ]}
    >
      {fields.map((field, i) => (
        <Text key={i} style={styles.tableCell}>
          {item[field]}
        </Text>
      ))}
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Image */}
        <Image 
          src="/header.png" 
          style={styles.headerImage} 
        />
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>BOLETÍN DE CALIFICACIONES</Text>
            <Text>{estudiante.anio}</Text>
          </View>

        {/* Student Info */}
        {renderStudentInfo()}

        {/* Áreas Académicas */}
        <Text style={styles.sectionTitle}>Áreas Académicas</Text>
        <View style={styles.table}>
          {renderTableHeader(['Área Académica', 'I UNIDAD', 'II UNIDAD', 'III UNIDAD', 'IV UNIDAD', 'NOTAS FINALES'])}
          {materias.map((materia) => 
            renderTableRow(materia, ['nombre_materia', 'u1', 'u2', 'u3', 'u4', 'final'])
          )}
          {renderTableRow({
            id: 'promedios',
            nombre_materia: 'Promedio por unidad',
            u1: promedios.u1.toFixed(2),
            u2: promedios.u2.toFixed(2),
            u3: promedios.u3.toFixed(2),
            u4: promedios.u4.toFixed(2),
            final: ''
          }, ['nombre_materia', 'u1', 'u2', 'u3', 'u4', 'final'], true)}
        </View>

        {/* Programas Educativos Extracurriculares */}
        <Text style={styles.sectionTitle}>Evaluaciones Extracurriculares</Text>
        
        {data.extracurriculares_valorativas.length > 0 ? (
          <>
            <View style={styles.table}>
              {renderTableHeader(['Actividad Extracurricular', 'I UNIDAD', 'II UNIDAD', 'III UNIDAD', 'IV UNIDAD', 'COMENTARIO'])}
              {data.extracurriculares_valorativas.map((item) => (
                <View key={item.id} style={[styles.tableRow, { backgroundColor: '#f8f9fa' }]}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.nombre}</Text>
                  <Text style={styles.tableCell}>{item.u1 || '-'}</Text>
                  <Text style={styles.tableCell}>{item.u2 || '-'}</Text>
                  <Text style={styles.tableCell}>{item.u3 || '-'}</Text>
                  <Text style={styles.tableCell}>{item.u4 || '-'}</Text>
                  <Text style={[styles.tableCell, { flex: 2, fontSize: 9 }]}>{item.comentario || ''}</Text>
                </View>
              ))}
            </View>
            
            {/* Summary of Extracurricular Activities */}
            <View style={{ marginTop: 10, marginBottom: 15, border: '1px solid #e0e0e0', padding: 10, borderRadius: 5, backgroundColor: '#f0f8ff' }}>
              <Text style={{ fontSize: 10, marginBottom: 5, fontWeight: 'bold' }}>Resumen de Actividades Extracurriculares:</Text>
              {data.extracurriculares_valorativas.map((item) => (
                <Text key={`summary-${item.id}`} style={{ fontSize: 9, marginBottom: 3 }}>
                  • {item.nombre}: {item.comentario || 'Sin comentarios'}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <Text style={{ fontStyle: 'italic', color: '#666', marginBottom: 15 }}>
            No hay evaluaciones extracurriculares registradas para este estudiante.
          </Text>
        )}

        <Text style={{ marginVertical: 8, fontSize: 12 }}>Responsabilidad del estudiante con su aprendizaje</Text>
        <View style={styles.table}>
          {renderTableHeader(['Descriptor', 'I UNIDAD', 'II UNIDAD', 'III UNIDAD', 'IV UNIDAD'])}
          {data.responsabilidad_aprendizaje.map((item) => 
            renderTableRow(item, ['nombre', 'u1', 'u2', 'u3', 'u4'])
          )}
        </View>

        <Text style={{ marginVertical: 8, fontSize: 12 }}>Responsabilidades del estudiante con su comportamiento</Text>
        <View style={styles.table}>
          {renderTableHeader(['Descriptor', 'I UNIDAD', 'II UNIDAD', 'III UNIDAD', 'IV UNIDAD'])}
          {data.responsabilidad_comportamiento.map((item) => 
            renderTableRow(item, ['nombre', 'u1', 'u2', 'u3', 'u4'])
          )}
        </View>

        <Text style={{ marginVertical: 8, fontSize: 12 }}>Hábitos Practicados en casa</Text>
        <View style={styles.table}>
          {renderTableHeader(['Hábito', 'I UNIDAD', 'II UNIDAD', 'III UNIDAD', 'IV UNIDAD'])}
          {data.habitos_casa.map((item) => 
            renderTableRow(item, ['nombre', 'u1', 'u2', 'u3', 'u4'])
          )}
        </View>

        <Text style={styles.footerNote}>
          Resultado: DESTACA, AVANZA, NECESITA MEJORAR, INSATISFACTORIO
        </Text>
        
          <Text style={styles.footer}>
            Sistema de Gestión Académica - {new Date().getFullYear()}
          </Text>
        </View>
        
        {/* Footer Image */}
        <Image 
          src="/footer.png" 
          style={styles.footerImage} 
        />
      </Page>
    </Document>
  );
};

export default GradeReportPdf;
