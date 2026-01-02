'use client';

import { useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 8,
    lineHeight: 1.1,
    color: '#333',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: 120, // Adjust based on your header image aspect ratio
    marginBottom: 8,
  },
  footerImage: {
    width: '100%',
    height: 80, // Adjust based on your footer image aspect ratio
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  content: {
    padding: 10,
    paddingBottom: 85, // Make space for the footer
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#0056b3',
    paddingBottom: 3,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0056b3',
    margin: 0,
  },
  studentInfo: {
    textAlign: 'center',
    marginBottom: 3,
    fontSize: 9,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 2,
    color: '#0056b3',
    paddingLeft: 2,
    borderLeftWidth: 2,
    borderLeftColor: '#0056b3',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 5,
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
    fontSize: 8,
  },
  highlightRow: {
    backgroundColor: '#fff9c4',
  },
  footerNote: {
    fontSize: 7,
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 10,
    right: 10,
    textAlign: 'center',
    fontSize: 7,
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
    habitos: any[]; // ← Nuevo: datos del endpoint de hábitos
    promedios: {
      u1: number;
      u2: number;
      u3: number;
      u4: number;
    };
  };
}

// Categorize the data into different sections using the 'tipo' field from the backend
const categorizeData = (data: any) => {
  console.log('=== NUEVA VERSIÓN DE CATEGORIZANDO DATOS DE HÁBITOS ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Data completa:', data);
  console.log('data.habitos:', data.habitos);
  console.log('Tipo de data.habitos:', typeof data.habitos);
  console.log('¿Es array?', Array.isArray(data.habitos));
  
  // Validar que data.habitos exista
  if (!data.habitos) {
    console.warn('data.habitos es undefined, devolviendo estructura vacía');
    return {
      ...data,
      extracurriculares_valorativas: [],
      responsabilidad_comportamiento: [],
      responsabilidad_aprendizaje: [],
      habitos_casa: []
    };
  }
  
  // Los datos ya vienen categorizados en el objeto habitos
  const habitosData = data.habitos;
  
  console.log('Estructura de habitosData:', Object.keys(habitosData));
  
  // Extraer las categorías ya procesadas
  const extracurriculares = habitosData.extracurriculares_valorativas || [];
  const responsabilidadComportamiento = habitosData.responsabilidad_comportamiento || [];
  const responsabilidadAprendizaje = habitosData.responsabilidad_aprendizaje || [];
  const habitosCasa = habitosData.habitos_casa || [];
  
  console.log('Categorización resultante:');
  console.log('- Extracurriculares:', extracurriculares.length);
  console.log('- Comportamiento:', responsabilidadComportamiento.length);
  console.log('- Aprendizaje:', responsabilidadAprendizaje.length);
  console.log('- Casa:', habitosCasa.length);

  return {
    ...data,
    extracurriculares_valorativas: extracurriculares,
    responsabilidad_comportamiento: responsabilidadComportamiento,
    responsabilidad_aprendizaje: responsabilidadAprendizaje,
    habitos_casa: habitosCasa
  };
};

const GradeReportPdf = ({ data }: GradeReportPdfProps) => {
  // Validar que los datos no sean null o undefined
  if (!data) {
    console.error('GradeReportPdf: data es null o undefined');
    return (
      <Document>
        <Page style={styles.page}>
          <Text style={styles.content}>Error: No hay datos disponibles para generar el reporte.</Text>
        </Page>
      </Document>
    );
  }

  // Helper function to safely access item properties
  const getItemValue = (item: any, field: string): string | number => {
    if (!item) return '';
    const value = item[field];
    return value === null || value === undefined ? '' : value;
  };
  
  // Categorize the data con validación
  const categorizedData = categorizeData(data);
  if (!categorizedData) {
    console.error('GradeReportPdf: categorizedData es null');
    return (
      <Document>
        <Page style={styles.page}>
          <Text style={styles.content}>Error: No se pudieron procesar los datos del reporte.</Text>
        </Page>
      </Document>
    );
  }
  
  const { estudiante, materias, promedios } = categorizedData;
  // Log the data received by the PDF component
  useEffect(() => {
    console.log('=== GRADE REPORT PDF DATA ===');
    console.log('Categorized Data:', categorizedData);
    console.log('Estudiante:', estudiante);
    console.log('Materias:', materias);
    console.log('Actividades Extracurriculares:', categorizedData.extracurriculares_valorativas);
    console.log('Responsabilidad Aprendizaje:', categorizedData.responsabilidad_aprendizaje);
    console.log('Responsabilidad Comportamiento:', categorizedData.responsabilidad_comportamiento);
    console.log('Hábitos en Casa:', categorizedData.habitos_casa);
    console.log('Promedios:', promedios);
    if ('periodo' in categorizedData) {
      console.log('Período:', categorizedData.periodo);
    }
    console.log('============================');
  }, [categorizedData, estudiante, materias, promedios]);

  const renderStudentInfo = () => (
    <View style={styles.studentInfo}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
        <Text style={{ fontSize: 9 }}>
          <Text style={{ fontWeight: 'bold' }}>Nombre:</Text> {`${estudiante.nombre} ${estudiante.apellido}`}
        </Text>
        <Text style={{ fontSize: 9 }}>
          <Text style={{ fontWeight: 'bold' }}>Grado:</Text> {estudiante.grado}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 9 }}>
          <Text style={{ fontWeight: 'bold' }}>DNI:</Text> {estudiante.dni}
        </Text>
        <Text style={{ fontSize: 9 }}>
          <Text style={{ fontWeight: 'bold' }}>Sección:</Text> {estudiante.seccion}
        </Text>
      </View>
    </View>
  );

  const renderTableHeader = (headers: string[], widths: string[]) => (
    <View style={[styles.tableRow, styles.tableHeader]}>
      {headers.map((header, index) => (
        <Text 
          key={index} 
          style={[
            styles.tableCell, 
            { 
              fontWeight: 'bold',
              width: widths[index] || 'auto',
              textAlign: index > 0 ? 'center' : 'left'
            }
          ]}
        >
          {header}
        </Text>
      ))}
    </View>
  );

  const renderTableRow = (item: any, fields: string[], widths: string[] = [], highlight = false) => {
    // Skip rendering if item is undefined or null
    if (!item) return null;
    
    return (
      <View 
        key={item.id || item.nombre} 
        style={[
          styles.tableRow, 
          highlight ? { backgroundColor: '#f5f5f5' } : {}
        ]}
      >
        {fields.map((field, i) => {
          const value = item[field];
          const displayValue = value === null || value === undefined ? '' : value;
          
          return (
            <Text 
              key={i} 
              style={[
                styles.tableCell, 
                { 
                  width: widths[i] || 'auto',
                  textAlign: i > 0 ? 'center' : 'left',
                  fontSize: field === 'nombre' ? 10 : 11
                }
              ]}
            >
              {displayValue}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <Document>
      <Page size={[8.5 * 72, 13 * 72]} style={styles.page}>
        {/* Header Image */}
        <Image 
          src="/header.png" 
          style={styles.headerImage} 
        />
        
        <View style={styles.content}>
          {/* Student Info */}
          <View style={{textAlign: 'center', marginBottom: 15}}>
            <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 5}}>
              {estudiante.nombre} {estudiante.apellido}
            </Text>
            <Text style={{fontSize: 12}}>Grado: {estudiante.grado} - Sección: {estudiante.seccion}</Text>
            <Text style={{fontSize: 12}}>Año: {estudiante.anio}</Text>
          </View>

          {/* Áreas Académicas */}
          <Text style={[styles.sectionTitle, {marginTop: 0}]}>Áreas Académicas</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, {width: '40%', fontWeight: 'bold'}]}>Áreas Académicas</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>I UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>II UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>III UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>IV UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>NOTAS FINALES</Text>
            </View>
            
            {materias.map((materia: Materia) => (
              <View key={materia.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, {width: '40%'}]}>{materia.nombre_materia}</Text>
                <Text style={[styles.tableCell, {width: '12%', textAlign: 'center'}]}>{materia.u1 || ''}</Text>
                <Text style={[styles.tableCell, {width: '12%', textAlign: 'center'}]}>{materia.u2 || ''}</Text>
                <Text style={[styles.tableCell, {width: '12%', textAlign: 'center'}]}>{materia.u3 || ''}</Text>
                <Text style={[styles.tableCell, {width: '12%', textAlign: 'center'}]}>{materia.u4 || ''}</Text>
                <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>{materia.final || ''}</Text>
              </View>
            ))}
            
            <View style={[styles.tableRow, {backgroundColor: '#f5f5f5'}]}>
              <Text style={[styles.tableCell, {width: '40%', fontWeight: 'bold'}]}>Promedio por unidad</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>{promedios.u1.toFixed(2)}</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>{promedios.u2.toFixed(2)}</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>{promedios.u3.toFixed(2)}</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center', fontWeight: 'bold'}]}>{promedios.u4.toFixed(2)}</Text>
              <Text style={[styles.tableCell, {width: '12%', textAlign: 'center'}]}></Text>
            </View>
          </View>

          {/* Áreas Extracurriculares */}
          <Text style={styles.sectionTitle}>Áreas Extracurriculares</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, {width: '60%', fontWeight: 'bold'}]}>Áreas Extracurriculares</Text>
              <Text style={[styles.tableCell, {width: '10%', textAlign: 'center', fontWeight: 'bold'}]}>I UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '10%', textAlign: 'center', fontWeight: 'bold'}]}>II UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '10%', textAlign: 'center', fontWeight: 'bold'}]}>III UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '10%', textAlign: 'center', fontWeight: 'bold'}]}>IV UNIDAD</Text>
            </View>
            
            {categorizedData.extracurriculares_valorativas?.length > 0 ? (
              categorizedData.extracurriculares_valorativas.map((item: any) => (
                <View key={item.id || `extra-${Math.random()}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, {width: '60%'}]}>{item.nombre || 'Sin nombre'}</Text>
                  <Text style={[styles.tableCell, {width: '10%', textAlign: 'center'}]}>{item.u1 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '10%', textAlign: 'center'}]}>{item.u2 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '10%', textAlign: 'center'}]}>{item.u3 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '10%', textAlign: 'center'}]}>{item.u4 || ''}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, {width: '100%', textAlign: 'center', fontStyle: 'italic'}]}>
                  No hay actividades extracurriculares registradas
                </Text>
              </View>
            )}
          </View>
          
          <View style={{marginTop: 5, marginBottom: 10}}>
            <Text style={{fontSize: 10, fontStyle: 'italic'}}>
              Programas Educativos Extracurriculares:
            </Text>
            <Text style={{fontSize: 10, fontStyle: 'italic'}}>
              Resultado: DESTACA, AVANZA, NECESITA MEJORAR, INSATISFACTORIO
            </Text>
          </View>

          {/* Responsabilidades del estudiante con su comportamiento */}
          <Text style={styles.sectionTitle}>Responsabilidades del estudiante con su comportamiento</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, {width: '60%', fontWeight: 'bold'}]}>Responsabilidades</Text>
              <Text style={[styles.tableCell, {width: '10%', textAlign: 'center', fontWeight: 'bold'}]}>I UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '10%', textAlign: 'center', fontWeight: 'bold'}]}>II UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '10%', textAlign: 'center', fontWeight: 'bold'}]}>III UNIDAD</Text>
              <Text style={[styles.tableCell, {width: '10%', textAlign: 'center', fontWeight: 'bold'}]}>IV UNIDAD</Text>
            </View>
            
            {categorizedData.responsabilidad_comportamiento?.length > 0 ? (
              categorizedData.responsabilidad_comportamiento.map((item: any) => (
                <View key={item.id || `comp-${Math.random()}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, {width: '60%'}]}>{item.nombre || 'Sin nombre'}</Text>
                  <Text style={[styles.tableCell, {width: '10%', textAlign: 'center'}]}>{item.u1 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '10%', textAlign: 'center'}]}>{item.u2 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '10%', textAlign: 'center'}]}>{item.u3 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '10%', textAlign: 'center'}]}>{item.u4 || ''}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, {width: '100%', textAlign: 'center', fontStyle: 'italic'}]}>
                  No hay responsabilidades de comportamiento registradas
                </Text>
              </View>
            )}
          </View>

          {/* Responsabilidad del estudiante con su aprendizaje */}
          <Text style={styles.sectionTitle}>Responsabilidad del estudiante con su aprendizaje</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, {width: '70%', fontWeight: 'bold'}]}>Responsabilidades de Aprendizaje</Text>
              <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center', fontWeight: 'bold'}]}>I</Text>
              <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center', fontWeight: 'bold'}]}>II</Text>
              <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center', fontWeight: 'bold'}]}>III</Text>
              <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center', fontWeight: 'bold'}]}>IV</Text>
            </View>
            
            {categorizedData.responsabilidad_aprendizaje?.length > 0 ? (
              categorizedData.responsabilidad_aprendizaje.map((item: any) => (
                <View key={item.id || `aprend-${Math.random()}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, {width: '70%'}]}>{item.nombre || 'Sin nombre'}</Text>
                  <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center'}]}>{item.u1 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center'}]}>{item.u2 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center'}]}>{item.u3 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center'}]}>{item.u4 || ''}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, {width: '100%', textAlign: 'center', fontStyle: 'italic'}]}>
                  No hay responsabilidades de aprendizaje registradas
                </Text>
              </View>
            )}
          </View>

          {/* Hábitos Practicados en casa */}
          <Text style={styles.sectionTitle}>Hábitos Practicados en casa</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, {width: '70%', fontWeight: 'bold'}]}>Hábitos en Casa</Text>
              <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center', fontWeight: 'bold'}]}>I</Text>
              <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center', fontWeight: 'bold'}]}>II</Text>
              <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center', fontWeight: 'bold'}]}>III</Text>
              <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center', fontWeight: 'bold'}]}>IV</Text>
            </View>
            
            {categorizedData.habitos_casa?.length > 0 ? (
              categorizedData.habitos_casa.map((item: any) => (
                <View key={item.id || `casa-${Math.random()}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, {width: '70%'}]}>{item.nombre || 'Sin nombre'}</Text>
                  <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center'}]}>{item.u1 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center'}]}>{item.u2 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center'}]}>{item.u3 || ''}</Text>
                  <Text style={[styles.tableCell, {width: '7.5%', textAlign: 'center'}]}>{item.u4 || ''}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, {width: '100%', textAlign: 'center', fontStyle: 'italic'}]}>
                  No hay hábitos en casa registrados
                </Text>
              </View>
            )}
          </View>

          <View style={{marginTop: 15, textAlign: 'center'}}>
            <Text style={{fontSize: 10, marginBottom: 5, fontWeight: 'bold'}}>
              Resultado: DESTACA, AVANZA, NECESITA MEJORAR, INSATISFACTORIO
            </Text>
            <Text style={{fontSize: 10, fontStyle: 'italic'}}>
              Sistema de Gestión Académica - {new Date().getFullYear()}
            </Text>
          </View>
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
