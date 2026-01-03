'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 10,
  },
});

interface TestPdfProps {
  data: any;
}

const TestPdf = ({ data }: TestPdfProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Test PDF</Text>
        <View style={styles.section}>
          <Text>Nombre: {data?.estudiante?.nombre || 'N/A'}</Text>
          <Text>Apellido: {data?.estudiante?.apellido || 'N/A'}</Text>
          <Text>Grado: {data?.estudiante?.grado || 'N/A'}</Text>
        </View>
        <View style={styles.section}>
          <Text>Materias: {data?.materias?.length || 0}</Text>
          <Text>Hábitos: {Object.keys(data?.habitos || {}).length}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TestPdf;
