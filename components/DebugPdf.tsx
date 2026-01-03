'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 10,
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
    padding: '2px 3px',
    textAlign: 'center',
    fontSize: 10,
  },
});

interface DebugPdfProps {
  data: any;
}

const DebugPdf = ({ data }: DebugPdfProps) => {
  const { estudiante, materias, promedios } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte de Calificaciones</Text>
        
        {/* Student Info */}
        <View style={styles.section}>
          <Text>Nombre: {estudiante.nombre} {estudiante.apellido}</Text>
          <Text>Grado: {estudiante.grado} - Sección: {estudiante.seccion}</Text>
          <Text>Año: {estudiante.anio}</Text>
        </View>

        {/* Materias Table */}
        <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 5}}>Áreas Académicas</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, {width: '40%'}]}>Materia</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}>I UNIDAD</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}>II UNIDAD</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}>III UNIDAD</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}>IV UNIDAD</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}>FINAL</Text>
          </View>
          
          {materias.map((materia: any, index: number) => (
            <View key={`materia-${index}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, {width: '40%'}]}>{materia.nombre_materia}</Text>
              <Text style={[styles.tableCell, {width: '12%'}]}>{materia.u1 || ''}</Text>
              <Text style={[styles.tableCell, {width: '12%'}]}>{materia.u2 || ''}</Text>
              <Text style={[styles.tableCell, {width: '12%'}]}>{materia.u3 || ''}</Text>
              <Text style={[styles.tableCell, {width: '12%'}]}>{materia.u4 || ''}</Text>
              <Text style={[styles.tableCell, {width: '12%'}]}>{materia.final || ''}</Text>
            </View>
          ))}
          
          <View style={[styles.tableRow, {backgroundColor: '#f5f5f5'}]}>
            <Text style={[styles.tableCell, {width: '40%', fontWeight: 'bold'}]}>Promedio</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}>{promedios?.u1?.toFixed(2) || '0.00'}</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}>{promedios?.u2?.toFixed(2) || '0.00'}</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}>{promedios?.u3?.toFixed(2) || '0.00'}</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}>{promedios?.u4?.toFixed(2) || '0.00'}</Text>
            <Text style={[styles.tableCell, {width: '12%'}]}></Text>
          </View>
        </View>

        {/* Hábitos */}
        <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 5, marginTop: 10}}>Hábitos</Text>
        <View style={styles.section}>
          <Text>Extracurriculares: {data.habitos?.extracurriculares_valorativas?.length || 0}</Text>
          <Text>Comportamiento: {data.habitos?.responsabilidad_comportamiento?.length || 0}</Text>
          <Text>Aprendizaje: {data.habitos?.responsabilidad_aprendizaje?.length || 0}</Text>
          <Text>Hábitos Casa: {data.habitos?.habitos_casa?.length || 0}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default DebugPdf;
