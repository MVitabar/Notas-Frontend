// components/DownloadGradeReportButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import GradeReportPdfFinal from './GradeReportPdfFinal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { habitGradeService } from '@/lib/services/habitGradeService';
import gradeService from '@/lib/services/gradeService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface HabitGrade {
  id: string;
  nombre: string;
  u1: string | null;
  u2: string | null;
  u3: string | null;
  u4: string | null;
  comentario: string | null;
}

interface ExtracurricularGrade {
  id: string;
  nombre: string;
  u1: string | null;
  u2: string | null;
  u3: string | null;
  u4: string | null;
  comentario: string | null;
}

interface HabitGradeResponse {
  habito_casa: Array<{
    id: string;
    nombre: string;
    u1: string | null;
    u2: string | null;
    u3: string | null;
    u4: string | null;
    comentario: string | null;
  }>;
  responsabilidad_aprendizaje: Array<{
    id: string;
    nombre: string;
    u1: string | null;
    u2: string | null;
    u3: string | null;
    u4: string | null;
    comentario: string | null;
  }>;
  comportamiento: Array<{
    id: string;
    nombre: string;
    u1: string | null;
    u2: string | null;
    u3: string | null;
    u4: string | null;
    comentario: string | null;
  }>;
  extracurriculares?: ExtracurricularGrade[]; // Make this optional
}

interface DownloadGradeReportButtonProps {
  estudiante: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    grado: string;
    seccion: string;
    anio: string;
  };
  periodo: {
    id: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  };
}

export function DownloadGradeReportButton({ estudiante, periodo }: DownloadGradeReportButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [pdfData, setPdfData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 PDF - Iniciando fetchData para:', estudiante.nombre, estudiante.apellido);

        // 1. Obtener TODAS las calificaciones académicas del estudiante (sin filtrar por período)
        const grades = await gradeService.getByStudent(
          estudiante.id,
          undefined // No filtrar por período para obtener todas las calificaciones
        );

        console.log('🔍 PDF - Calificaciones recibidas:', grades);
        console.log('🔍 PDF - Total de calificaciones:', grades.length);
        console.log('🔍 PDF - Estructura de primera calificación:', grades[0]);
        console.log('🔍 PDF - Campos de calificación:', grades[0] ? Object.keys(grades[0]) : 'No hay calificaciones');
        console.log('🔍 PDF - Campo esExtraescolar en getByStudent:', grades[0] ? grades[0].esExtraescolar : 'No disponible');
        console.log('🔍 PDF - Campo unidad en getByStudent:', grades[0] ? grades[0].unidad : 'No disponible');

        // 2. Inicializar estructura de hábitos con valores por defecto
        let habitData: {
          habitos_casa: HabitGrade[];
          responsabilidad_aprendizaje: HabitGrade[];
          responsabilidad_comportamiento: HabitGrade[];
          extracurriculares_valorativas: ExtracurricularGrade[];
        } = {
          habitos_casa: [],
          responsabilidad_aprendizaje: [],
          responsabilidad_comportamiento: [],
          extracurriculares_valorativas: []
        };

        try {
          const habitGrades = await gradeService.getHabitGrades(estudiante.id, periodo.id);
          
          console.log('🔍 PDF - HabitGrades recibidas:', habitGrades);
          console.log('🔍 PDF - Tipos encontrados:', [...new Set(habitGrades.map((h: any) => h.tipo))]);
          console.log('🔍 PDF - Nombres de todas las evaluaciones:', habitGrades.map((h: any) => h.nombre));
          console.log('🔍 PDF - Buscando extracurriculares con tipo EXTRACURRICULAR:', habitGrades.filter((h: any) => h.tipo === 'EXTRACURRICULAR'));

          // Los datos ya vienen categorizados por el campo 'tipo' del backend
          // Solo necesitamos pasarlos directamente al PDF
          habitData = {
            habitos_casa: habitGrades.filter((h: any) => h.tipo === 'CASA'),
            responsabilidad_aprendizaje: habitGrades.filter((h: any) => h.tipo === 'APRENDIZAJE'),
            responsabilidad_comportamiento: habitGrades.filter((h: any) => h.tipo === 'COMPORTAMIENTO'),
            extracurriculares_valorativas: habitGrades.filter((h: any) => {
              // Filtrar extracurriculares usando múltiples criterios basados en los datos reales
              // Criterio 1: esExtracurricular === true (más confiable según los datos)
              const esExtraPorFlag = h.esExtracurricular === true;
              
              // Criterio 2: tipoMateriaId específico de extracurriculares
              const esExtraPorTipoMateriaId = h.tipoMateriaId === '84324295-386d-4d43-9fdd-043ac7689b22';
              
              // Criterio 3: tipo === 'EXTRACURRICULAR' (si existe)
              const esExtraPorTipo = h.tipo === 'EXTRACURRICULAR';
              
              // Criterio 4: tipoMateriaNombre === 'EXTRACURRICULAR' (si existe)
              const esExtraPorTipoMateriaNombre = h.tipoMateriaNombre === 'EXTRACURRICULAR';
              
              // Criterio 5: Por nombre (fallback)
              const nombresExtra = [
                'comprensión de lectura',
                'lógica matemática', 
                'moral cristiana',
                'programa de lectura',
                'razonamiento verbal'
              ];
              const nombre = (h.nombre || '').toLowerCase();
              const esExtraPorNombre = nombresExtra.some(n => nombre.includes(n));
              
              // Criterio 6: Verificar que la materia esté disponible para el grado del estudiante
              let esValidaParaGrado = true; // Por defecto es válida
              let debugGradoInfo = '';
              
              if (h.grados && estudiante.grado) {
                // El estudiante.grado viene como "4° Bachillerato en Ciencias y Letras" o similar
                const gradoEstudiante = estudiante.grado;
                debugGradoInfo = `Grado Estudiante: ${gradoEstudiante}`;
                
                // Extraer componentes del grado del estudiante
                const gradoMatch = gradoEstudiante.match(/(\d+)°?\s*(.+)/);
                if (gradoMatch) {
                  const [, grado, resto] = gradoMatch;  
                  const nivel = resto.split(' ')[0]; // Primer palabra después del número
                  
                  // Construir diferentes formatos para verificar según el tipo de grado
                  let formatos = [gradoEstudiante]; 
                  
                  // Agregar variaciones específicas según el nivel
                  if (nivel.includes('Perito')) {
                    formatos.push(
                      `${grado}° ${nivel}`, // "4° Perito Contador"
                      `${grado}° ${nivel.split(' ')[0]}`, // "4° Perito"
                      `${grado} PC`, // "4 PC"
                      `${grado}° PC`, // "4° PC"
                      `${grado}°PC`, // "4°PC"
                      `${grado}${nivel.split(' ')[0]}` // "4Perito"
                    );
                  } else if (nivel.includes('Bachillerato') || nivel.includes('BCL')) {
                    formatos.push(
                      `${grado}° ${nivel}`, // "4° Bachillerato"
                      `${grado}°${nivel}`, // "4°Bachillerato"
                      `${grado} BCL`, // "4 BCL"
                      `${grado}°BCL`, // "4°BCL"
                      `${grado}BCL` // "4BCL"
                    );
                  } else if (nivel.includes('Básico')) {
                    formatos.push(
                      `${grado}° ${nivel}`, // "1° Básico"
                      `${grado} Básico` // "1 Básico"
                    );
                  } else if (nivel.includes('Primaria')) {
                    formatos.push(
                      `${grado}° ${nivel}`, // "4° Primaria"
                      `${grado} Primaria` // "4 Primaria"
                    );
                  }
                  
                  // Verificar si algún formato coincide con los grados de la materia
                  esValidaParaGrado = h.grados.some((g: string) => 
                    formatos.some(formato => 
                      g === formato || 
                      g.includes(formato) || 
                      formato.includes(g) ||
                      (g.includes(`${grado}°`) && g.includes(nivel))
                    )
                  );
                  
                  if (h.esExtracurricular === true) {
                    console.log(`🔍 PDF Grado Check - ${h.nombre}:`, {
                      materiaGrados: h.grados,
                      gradoEstudiante,
                      formatos,
                      resultado: esValidaParaGrado,
                      debugInfo: debugGradoInfo
                    });
                  }
                } else {
                  // Si no puede parsear el grado, verificar coincidencia directa
                  esValidaParaGrado = h.grados.includes(gradoEstudiante);
                  
                  if (h.esExtracurricular === true) {
                    console.log(`🔍 PDF Grado Check (fallback) - ${h.nombre}:`, {
                      materiaGrados: h.grados,
                      gradoEstudiante,
                      resultado: esValidaParaGrado,
                      debugInfo: 'No se pudo parsear el grado'
                    });
                  }
                }
              }
              
              const esExtra = esExtraPorFlag || esExtraPorTipoMateriaId || esExtraPorTipo || esExtraPorTipoMateriaNombre || esExtraPorNombre;
              
              // Solo incluir si es extracurricular Y es válida para el grado del estudiante
              return esExtra && esValidaParaGrado;
            })
          };
          
          console.log('🔍 PDF - Extracurriculares filtradas:', habitData.extracurriculares_valorativas);
          console.log('🔍 PDF - esExtracurricular flags:', habitGrades.filter((h: any) => h.esExtracurricular === true).map((h: any) => h.nombre));
          console.log('🔍 PDF - tipoMateriaId de extracurriculares:', habitGrades.filter((h: any) => h.tipoMateriaId === '84324295-386d-4d43-9fdd-043ac7689b22').map((h: any) => h.nombre));
          console.log('🔍 PDF - Grado del estudiante:', estudiante.grado);
          console.log('🔍 PDF - Extracurriculares con grados:', habitGrades.filter((h: any) => h.esExtracurricular === true).map((h: any) => ({nombre: h.nombre, grados: h.grados})));
        } catch (habitError) {
          console.warn('No se pudieron cargar las evaluaciones de hábitos, continuando sin ellas:', habitError);
        }

        // 3. Calcular promedios
        const calculateAverage = (unit: string) => {
          const validGrades = grades
            .filter((g: any) => g[unit] !== undefined && g[unit] !== null)
            .map((g: any, index: number) => ({ 
              value: Number(g[unit]), 
              key: `grade-${unit}-${index}` 
            }));
          
          if (validGrades.length === 0) return 0;
          return validGrades.reduce((sum: number, item: any) => sum + item.value, 0) / validGrades.length;
        };

        const promedios = {
          u1: calculateAverage('u1'),
          u2: calculateAverage('u2'),
          u3: calculateAverage('u3'),
          u4: calculateAverage('u4')
        };

        // 4. Agrupar calificaciones por materia para evitar duplicación
        const materiasMap = new Map<string, any>();
        
        for (const grade of grades as any[]) {
          const materia = grade.materia || {};
          const materiaId = materia.id || 'unknown';
          
          // 🔥 CORRECCIÓN: La calificación viene directamente como número
          const calificacionValor = grade.calificacion || 0;
          const unidad = grade.unidad || 'u1'; // Obtener la unidad de la calificación
          
          console.log('🔍 Procesando materia:', materia.nombre, 'tipoMateria:', materia.tipoMateria, 'con calificación:', calificacionValor, 'en unidad:', unidad);
          
          // Si la materia no existe en el mapa, crearla
          if (!materiasMap.has(materiaId)) {
            const materiaData = {
              id: materiaId,
              nombre: materia.nombre || 'Materia sin nombre',
              tipoMateria: materia.tipoMateria || 'Sin tipo',
              tipoMateriaId: materia.tipoMateriaId,
              esExtraescolar: grade.esExtraescolar || false, // Agregar campo esExtraescolar
              // Inicializar todas las unidades en 0
              u1: 0,
              u2: 0,
              u3: 0,
              u4: 0,
              final: 0
            };
            materiasMap.set(materiaId, materiaData);
          }
          
          // Obtener la materia existente y actualizar la unidad correspondiente
          const materiaExistente = materiasMap.get(materiaId);
          
          // Asignar la calificación a la unidad correspondiente
          if (unidad === 'u1') {
            materiaExistente.u1 = calificacionValor;
          } else if (unidad === 'u2') {
            materiaExistente.u2 = calificacionValor;
          } else if (unidad === 'u3') {
            materiaExistente.u3 = calificacionValor;
          } else if (unidad === 'u4') {
            materiaExistente.u4 = calificacionValor;
          }
          
          // Calcular promedio final de las 4 unidades
          const unidades = [materiaExistente.u1, materiaExistente.u2, materiaExistente.u3, materiaExistente.u4];
          const unidadesValidas = unidades.filter(u => u > 0); // Solo unidades con calificación > 0
          
          if (unidadesValidas.length > 0) {
            const promedio = unidadesValidas.reduce((sum, u) => sum + u, 0) / unidadesValidas.length;
            materiaExistente.final = Math.round(promedio); // Redondear a número entero
          } else {
            materiaExistente.final = 0;
          }
        }
        
        // Convertir el mapa a arrays separando materias regulares de extracurriculares
        const materiasRegulares: Array<{
          id: string;
          nombre_materia: string;
          tipoMateria: string;
          u1: number;
          u2: number;
          u3: number;
          u4: number;
          final: number;
        }> = [];
        
        const extracurriculares: Array<{
          id: string;
          nombre: string;
          u1: number | null;
          u2: number | null;
          u3: number | null;
          u4: number | null;
          comentario: string | null;
        }> = [];
        
        // Procesar las materias agrupadas
        for (const materiaData of materiasMap.values()) {
          // Verificar si es extracurricular por múltiples criterios
          const isExtracurricular = (
            materiaData.esExtraescolar || // Campo directo del backend
            materiaData.tipoMateria === 'EXTRACURRICULAR' || // Tipo de materia
            materiaData.tipoMateriaId === '84324295-386d-4d43-9fdd-043ac7689b22' // ID específico
          );
          
          console.log('🔍 PDF - Procesando materia:', materiaData.nombre, 'esExtraescolar:', materiaData.esExtraescolar, 'tipoMateria:', materiaData.tipoMateria, 'isExtracurricular:', isExtracurricular);
          
          if (isExtracurricular) {
            extracurriculares.push({
              id: materiaData.id,
              nombre: materiaData.nombre,
              u1: typeof materiaData.u1 === 'number' && materiaData.u1 > 0 ? materiaData.u1 : null,
              u2: typeof materiaData.u2 === 'number' && materiaData.u2 > 0 ? materiaData.u2 : null,
              u3: typeof materiaData.u3 === 'number' && materiaData.u3 > 0 ? materiaData.u3 : null,
              u4: typeof materiaData.u4 === 'number' && materiaData.u4 > 0 ? materiaData.u4 : null,
              comentario: null
            });
          } else {
            // Es una materia regular
            materiasRegulares.push({
              id: materiaData.id,
              nombre_materia: materiaData.nombre,
              tipoMateria: materiaData.tipoMateria,
              u1: typeof materiaData.u1 === 'number' ? materiaData.u1 : 0,
              u2: typeof materiaData.u2 === 'number' ? materiaData.u2 : 0,
              u3: typeof materiaData.u3 === 'number' ? materiaData.u3 : 0,
              u4: typeof materiaData.u4 === 'number' ? materiaData.u4 : 0,
              final: materiaData.final
            });
          }
        }

        // 5. Crear estructura final de datos para el PDF
        // Combinar extracurriculares de ambas fuentes: getHabitGrades y getByStudent
        // Priorizar evaluaciones de hábitos sobre calificaciones académicas cuando ambas existen
        const extracurricularesCombinadas = [
          ...habitData.extracurriculares_valorativas, // De getHabitGrades (sin campo grados)
          ...extracurriculares // De getByStudent (con campo grados)
        ];

        // Crear mapa de extracurriculares por nombre para priorizar
        const extracurricularesMap = new Map<string, any>();
        
        // Primero agregar evaluaciones de hábitos (prioridad alta)
        habitData.extracurriculares_valorativas.forEach(extracurricular => {
          extracurricularesMap.set(extracurricular.nombre, {
            ...extracurricular,
            fuente: 'habitGrades'
          });
        });
        
        // Luego agregar calificaciones académicas (prioridad baja - solo si no existe)
        extracurriculares.forEach(extracurricular => {
          if (!extracurricularesMap.has(extracurricular.nombre)) {
            extracurricularesMap.set(extracurricular.nombre, {
              ...extracurricular,
              fuente: 'getByStudent'
            });
          }
        });

        // Convertir a array y filtrar por grado del estudiante
        let extracurricularesUnicas = Array.from(extracurricularesMap.values());
        
        // Filtrar por grado del estudiante
        if (estudiante.grado) {
          const gradoEstudiante = estudiante.grado;
          console.log('🔍 PDF - Filtrando extracurriculares por grado:', gradoEstudiante);
          
          // Extraer componentes del grado del estudiante
          const gradoMatch = gradoEstudiante.match(/(\d+)°?\s*(.+)/);
          if (gradoMatch) {
            const [, grado, resto] = gradoMatch;  
            const nivel = resto.split(' ')[0]; // Primer palabra después del número
            
            // Construir diferentes formatos para verificar según el tipo de grado
            let formatos = [gradoEstudiante]; // Original: "4° Perito Contador"
            
            // Agregar variaciones específicas según el nivel
            if (nivel.includes('Perito')) {
              formatos.push(
                `${grado}° ${nivel}`, // "4° Perito Contador"
                `${grado}° ${nivel.split(' ')[0]}`, // "4° Perito"
                `${grado} PC`, // "4 PC"
                `${grado}° PC`, // "4° PC"
                `${grado}°PC`, // "4°PC"
                `${grado}${nivel.split(' ')[0]}` // "4Perito"
              );
            } else if (nivel.includes('Bachillerato') || nivel.includes('BCL')) {
              formatos.push(
                `${grado}° ${nivel}`, // "4° Bachillerato"
                `${grado}°${nivel}`, // "4°Bachillerato"
                `${grado} BCL`, // "4 BCL"
                `${grado}°BCL`, // "4°BCL"
                `${grado}BCL` // "4BCL"
              );
            } else if (nivel.includes('Básico')) {
              formatos.push(
                `${grado}° ${nivel}`, // "1° Básico"
                `${grado} Básico` // "1 Básico"
              );
            } else if (nivel.includes('Primaria')) {
              formatos.push(
                `${grado}° ${nivel}`, // "4° Primaria"
                `${grado} Primaria` // "4 Primaria"
              );
            }
            console.log('🔍 PDF - Formatos de grado a verificar:', formatos);
            
            extracurricularesUnicas = extracurricularesUnicas.filter(extracurricular => {
              // Si tiene campo grados (de getByStudent), usarlo para filtrar
              if (extracurricular.grados && Array.isArray(extracurricular.grados)) {
                const esValida = extracurricular.grados.some((g: string) => 
                  formatos.some(formato => 
                    g === formato || 
                    g.includes(formato) || 
                    formato.includes(g) ||
                    (g.includes(`${grado}°`) && g.includes(nivel))
                  )
                );
                
                console.log(`🔍 PDF - Filtrado ${extracurricular.nombre}:`, {
                  materiaGrados: extracurricular.grados,
                  esValida,
                  fuente: extracurricular.fuente
                });
                
                return esValida;
              } else {
                // Si no tiene campo grados (de habitGrades), verificar por nombre contra academicData
                const nombresPorGrado = {
                  '1° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                  '2° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                  '3° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                  '4° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                  '5° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                  '6° Primaria': ['Comprensión de Lectura', 'Lógica Matemática'],
                  '1° Básico': ['Moral Cristiana', 'Programa de Lectura'],
                  '2° Básico': ['Moral Cristiana', 'Programa de Lectura'],
                  '3° Básico': ['Moral Cristiana', 'Programa de Lectura'],
                  '4° PC': ['Moral Cristiana', 'Programa de Lectura'],
                  '5° PC': ['Moral Cristiana', 'Programa de Lectura'],
                  '6° PC': ['Moral Cristiana', 'Programa de Lectura'],
                  '4° Perito Contador': ['Moral Cristiana', 'Programa de Lectura'],
                  '5° Perito Contador': ['Moral Cristiana', 'Programa de Lectura'],
                  '6° Perito Contador': ['Moral Cristiana', 'Programa de Lectura'],
                  '4° Perito': ['Moral Cristiana', 'Programa de Lectura'],
                  '5° Perito': ['Moral Cristiana', 'Programa de Lectura'],
                  '6° Perito': ['Moral Cristiana', 'Programa de Lectura'],
                  '4° BCL': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                  '5° BCL': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                  '6° BCL': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                  // Agregar más formatos para Bachillerato
                  '4° Bachillerato': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                  '5° Bachillerato': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                  '6° Bachillerato': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                  '4° Bachillerato en Ciencias y Letras': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                  '5° Bachillerato en Ciencias y Letras': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
                  '6° Bachillerato en Ciencias y Letras': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal']
                };
                
                // Construir formatos específicos según el tipo de grado
                let formatosParaBuscar = [gradoEstudiante];
                let nombresValidos: string[] = [];
                
                if (nivel.includes('Perito')) {
                  formatosParaBuscar = [
                    gradoEstudiante,
                    `${grado}° ${nivel}`, // "4° Perito Contador"
                    `${grado}° ${nivel.split(' ')[0]}`, // "4° Perito"
                    `${grado} PC`, // "4 PC"
                    `${grado}° PC`, // "4° PC"
                    `${grado}Perito` // "4Perito"
                  ];
                } else if (nivel.includes('Bachillerato') || nivel.includes('BCL') || nivel.includes('Ciencias') || nivel.includes('Letras')) {
                  formatosParaBuscar = [
                    gradoEstudiante,
                    `${grado}° BCL`, // "4° BCL"
                    `${grado} BCL`, // "4 BCL"
                    `${grado}°BCL`, // "4°BCL"
                    `${grado}BCL`, // "4BCL"
                    `${grado}° Bachillerato`, // "4° Bachillerato"
                    `${grado} Bachillerato`, // "4 Bachillerato"
                    `${grado}° Bachillerato en Ciencias y Letras`, // "4° Bachillerato en Ciencias y Letras"
                    `${grado} Bachillerato en Ciencias y Letras` // "4 Bachillerato en Ciencias y Letras"
                  ];
                } else if (nivel.includes('Básico')) {
                  formatosParaBuscar = [
                    gradoEstudiante,
                    `${grado}° ${nivel}`, // "1° Básico"
                    `${grado} Básico` // "1 Básico"
                  ];
                } else if (nivel.includes('Primaria')) {
                  formatosParaBuscar = [
                    gradoEstudiante,
                    `${grado}° ${nivel}`, // "4° Primaria"
                    `${grado} Primaria` // "4 Primaria"
                  ];
                }
                
                for (const formato of formatosParaBuscar) {
                  const encontrados = nombresPorGrado[formato as keyof typeof nombresPorGrado] || [];
                  if (encontrados.length > 0) {
                    nombresValidos = encontrados;
                    break;
                  }
                }
                
                const esValida = nombresValidos.includes(extracurricular.nombre);
                
                console.log(`🔍 PDF - Filtrado por nombre ${extracurricular.nombre}:`, {
                  gradoEstudiante,
                  formatosParaBuscar,
                  nombresValidos,
                  esValida,
                  fuente: extracurricular.fuente
                });
                
                return esValida;
              }
            });
          }
        }

        const transformedData = {
          estudiante: {
            ...estudiante,
            seccion: estudiante.seccion || 'A'
          },
          materias: materiasRegulares,
          habitos: {
            ...habitData,
            extracurriculares_valorativas: extracurricularesUnicas // Usar las extracurriculares combinadas y únicas
          },
          promedios,
          periodo
        };
        
        // Debug logs para extracurriculares
        console.log('🔍 PDF - Materias procesadas:', materiasMap.size);
        console.log('🔍 PDF - Extracurriculares encontradas:', extracurriculares.length);
        console.log('🔍 PDF - Extracurriculares:', extracurriculares);
        console.log('🔍 PDF - HabitData.extracurriculares_valorativas:', habitData.extracurriculares_valorativas);
        console.log('🔍 PDF - TransformedData.habitos.extracurriculares_valorativas:', transformedData.habitos.extracurriculares_valorativas);
        
        setPdfData(transformedData);
      } catch (error) {
        console.error('Error al cargar datos para el PDF:', error);
        setError('Error al cargar los datos del reporte. Por favor, intente nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [estudiante, periodo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Cargando datos del reporte...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p className="font-medium">Error</p>
        <p>{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
        No hay datos disponibles para generar el reporte
      </div>
    );
  }

  const fileName = `reporte-${estudiante.nombre}-${estudiante.apellido}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>Vista Previa PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa del Reporte de Calificaciones</DialogTitle>
          <DialogDescription>
            Vista previa del reporte de calificaciones del estudiante con opción de descargar en formato PDF
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%" className="border rounded-md">
            <GradeReportPdfFinal data={pdfData} />
          </PDFViewer>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" asChild>
            <PDFDownloadLink
              document={<GradeReportPdfFinal data={pdfData} />}
              fileName={fileName}
              className="flex items-center gap-2"
            >
              {({ loading }) => (
                <>
                  <Download className="h-4 w-4" />
                  {loading ? 'Generando...' : 'Descargar PDF'}
                </>
              )}
            </PDFDownloadLink>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadGradeReportButton;