'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.googleapis.com/css?family=Helvetica',
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1pt solid #e0e0e0',
    paddingBottom: 5,
  },
  studentInfo: {
    marginBottom: 20,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #e0e0e0',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
    borderRight: '1pt solid #e0e0e0',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTop: '1pt solid #e0e0e0',
    paddingTop: 10,
  },
});

interface SimpleGradeReportProps {
  data: {
    estudiante: {
      nombre: string;
      apellido: string;
      grado: string;
      seccion?: string;
    };
    materias: Array<{
      nombre_materia: string;
      u1: number;
      u2: number;
      u3: number;
      u4: number;
      final: number;
    }>;
    promedios: {
      u1: number;
      u2: number;
      u3: number;
      u4: number;
    };
    periodo?: {
      nombre: string;
    };
  };
}

const SimpleGradeReportPdf = ({ data }: SimpleGradeReportProps) => {
  if (!data || !data.estudiante) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>Error: No hay datos disponibles</Text>
        </Page>
      </Document>
    );
  }

  const { estudiante, materias, promedios, periodo } = data;

  return (
    <Document>
      <Page style={styles.page}>
        {/* Header */}
        <View style={styles.title}>
          <Text>REPORTE DE CALIFICACIONES</Text>
        </View>

        {/* Student Info */}
        <View style={styles.studentInfo}>
          <Text>Nombre: {estudiante.nombre} {estudiante.apellido}</Text>
          <Text>Grado: {estudiante.grado} {estudiante.seccion || ''}</Text>
          <Text>Período: {periodo?.nombre || 'N/A'}</Text>
        </View>

        {/* Grades Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calificaciones Académicas</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '40%' }]}>Materia</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>U1</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>U2</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>U3</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>U4</Text>
            </View>
            {materias.map((materia, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '40%' }]}>{materia.nombre_materia}</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
                  {materia.u1 || '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
                  {materia.u2 || '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
                  {materia.u3 || '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>
                  {materia.u4 || '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Promedios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promedios Generales</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '50%' }]}>Período</Text>
              <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'center' }]}>U1</Text>
              <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'center' }]}>U2</Text>
              <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'center' }]}>U3</Text>
              <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'center' }]}>U4</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '50%' }]}>Promedio General</Text>
              <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'center' }]}>
                {promedios.u1.toFixed(1)}
              </Text>
              <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'center' }]}>
                {promedios.u2.toFixed(1)}
              </Text>
              <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'center' }]}>
                {promedios.u3.toFixed(1)}
              </Text>
              <Text style={[styles.tableCell, { width: '12.5%', textAlign: 'center' }]}>
                {promedios.u4.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generado el {new Date().toLocaleDateString()} - Sistema de Gestión Académica</Text>
        </View>
      </Page>
    </Document>
  );
};

export default SimpleGradeReportPdf;
