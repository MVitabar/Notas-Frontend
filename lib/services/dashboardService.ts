import { api } from '../api';
import { AxiosError } from 'axios';
import { format } from 'date-fns';
import { type CalificacionResponse } from './gradeService';

export interface MateriaBase {
  id: string;
  nombre: string;
  descripcion: string;
  grado: string;
  nivel: string;
  seccion: string;
  codigo?: string;
  creditos?: number;
  activa?: boolean;
  tipoMateria?: {
    id: string;
    nombre: string;
    descripcion: string;
  };
  docenteId?: number;
  estudiantes?: number;
  [key: string]: any; // Allow additional properties
}

export interface MateriaResponse {
  id: string;
  docenteId: string;
  materiaId: string;
  seccion: string;
  horario: string;
  periodo: string;
  estado: string;
  periodoAcademicoId: string;
  createdAt: string;
  updatedAt: string;
  materia: {
    id: string;
    nombre: string;
    descripcion: string;
    codigo: string;
    creditos: number;
    activa: boolean;
    tipoMateriaId: string | null;
    tipoMateria?: {
      id: string;
      nombre: string;
      descripcion: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  periodoAcademico?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    status: string;
  };
}

export interface Materia {
  id: number;
  nombre: string;
  descripcion: string;
  grado: string;
  nivel: string;
  seccion: string;
  docenteId: number;
  estudiantes: number;
  notasBimestre1?: number;
  notasBimestre2?: number;
  notasBimestre3?: number;
  notasBimestre4?: number;
}

export interface ActividadReciente {
  id: number;
  accion: string;
  fecha: string;
  detalles: string;
  usuario: string;
}

export interface EstadisticasBimestre {
  numero: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'completado' | 'activo' | 'pendiente';
  promedio?: number;
}

// Interfaz para los grados agrupados
export interface GradoConMaterias {
  grado: string;
  nivel: string;
  seccion: string;
  materias: MateriaBase[]; // Changed from Materia[] to MateriaBase[]
  totalEstudiantes: number;
  estudiantes: any[]; // Lista de estudiantes en este grado
}

export interface MateriaAsignada {
  id: string;
  seccion: string;
  horario: string;
  periodo: string;
  estado: string;
  materia: {
    id: string;
    nombre: string;
    codigo?: string;
    creditos?: number;
    activa?: boolean;
    tipoMateria?: {
      id: string;
      nombre: string;
      descripcion: string;
    };
  };
  periodoAcademico?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    status: string;
  };
}

export interface TeacherProfile {
  id: string;
  userId: string;
  email: string;
  nombre: string;
  apellido: string;
  perfilDocente: {
    id: string;
    userId: string;
    contactoEmergencia: string;
    telefonoEmergencia: string;
    status: string;
    grados: string[];
    createdAt: string;
    updatedAt: string;
  };
  materias?: MateriaAsignada[];
}

// Add AcademicPeriod type from academicPeriodService
type AcademicPeriod = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  description?: string;
};

export type Bimestre = {
  id: string;
  numero: number;
  nombre: string;
  estado: 'completado' | 'activo' | 'proximo';
  fechaInicio: string;
  fechaFin: string;
  progreso: number;
  descripcion?: string;
  // Propiedades adicionales que podrían ser útiles
  isCurrent?: boolean;
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
};

export interface Estudiante {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  grados: string[];
  activo: boolean;
  secciones: string[];
  createdAt: string;
  updatedAt: string;
  // For backward compatibility with existing code
  firstName?: string;
  lastName?: string;
}

export interface EstudianteConCalificaciones extends Estudiante {
  calificaciones: CalificacionResponse[];
}

export const dashboardService = {
  // Calcular bimestres basados en las fechas del período académico
  calcularBimestres(periodo: {
    startDate: string | Date;
    endDate: string | Date;
  }): Bimestre[] {
    const startDate = new Date(periodo.startDate);
    const endDate = new Date(periodo.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const bimestreDuration = Math.ceil(diffDays / 4); // Dividir en 4 bimestres

    const hoy = new Date();
    const bimestres: Bimestre[] = [];

    for (let i = 0; i < 4; i++) {
      const bimestreStart = new Date(startDate);
      bimestreStart.setDate(startDate.getDate() + (i * bimestreDuration));

      let bimestreEnd = new Date(startDate);
      bimestreEnd.setDate(startDate.getDate() + ((i + 1) * bimestreDuration) - 1);

      // Asegurarse de que el último día no sea mayor que la fecha de fin
      if (bimestreEnd > endDate) {
        bimestreEnd = new Date(endDate);
      }

      // Determinar el estado del bimestre
      let estado: 'completado' | 'activo' | 'proximo' = 'proximo';
      if (hoy >= bimestreStart && hoy <= bimestreEnd) {
        estado = 'activo';
      } else if (hoy > bimestreEnd) {
        estado = 'completado';
      }

      const bimestreId = `bimestre-${i + 1}-${bimestreStart.getFullYear()}`;

      bimestres.push({
        id: bimestreId,
        numero: i + 1,
        nombre: `Bimestre ${i + 1}`,
        estado,
        fechaInicio: bimestreStart.toISOString(),
        fechaFin: bimestreEnd.toISOString(),
        progreso: estado === 'completado' ? 100 :
          estado === 'activo' ?
            Math.min(99, Math.max(1, Math.round(
              ((hoy.getTime() - bimestreStart.getTime()) /
                (bimestreEnd.getTime() - bimestreStart.getTime())) * 100
            ))) : 0,
        isCurrent: estado === 'activo',
        status: estado === 'activo' ? 'active' : estado === 'completado' ? 'completed' : 'upcoming',
        descripcion: `Período del ${format(bimestreStart, 'dd/MM/yyyy')} al ${format(bimestreEnd, 'dd/MM/yyyy')}`
      });
    }

    return bimestres;
  },
  async getMaterias(): Promise<MateriaResponse[]> {
    try {
      console.log('Fetching materias from API...');
      const response = await api.get<MateriaResponse[]>('/materias/docente/mis-materias');
      console.log('Raw materias response:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener las materias:', error);
      return [];
    }
  },

  async getCurrentAcademicPeriod() {
    try {
      const response = await api.get('/academic-periods/current');

      // El endpoint devuelve el objeto directamente, no está envuelto en { data: ... }
      return response.data || null;
    } catch (error: any) {
      console.error('❌ [dashboardService] Error al obtener el período académico actual:');

      if (error.response) {
        if (error.response.status === 404) {
          console.log('ℹ️ [dashboardService] No se encontró un período académico activo');
        } else {
          console.error('📡 [dashboardService] Error del servidor:', {
            status: error.response.status,
            data: error.response.data
          });
        }
      } else if (error.request) {
        console.error('🔌 [dashboardService] No se recibió respuesta del servidor');
      } else {
        console.error('⚠️ [dashboardService] Error al configurar la solicitud:', error.message);
      }

      return null;
    }
  },

  // Nueva función para obtener el período con isCurrent: true (fallback si current falla)
  async getActiveAcademicPeriod() {
    try {
      console.log('🔍 [dashboardService] Buscando período con isCurrent: true...');
      const response = await api.get('/academic-periods');
      
      if (response.data && Array.isArray(response.data)) {
        const activePeriod = response.data.find((period: any) => period.isCurrent === true);
        
        if (activePeriod) {
          console.log('✅ [dashboardService] Período activo encontrado:', {
            id: activePeriod.id,
            name: activePeriod.name,
            isCurrent: activePeriod.isCurrent,
            unidadAsignada: activePeriod.unidadAsignada
          });
          return activePeriod;
        } else {
          console.warn('⚠️ [dashboardService] No se encontró ningún período con isCurrent: true');
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ [dashboardService] Error al obtener períodos académicos:', error);
      return null;
    }
  },

  // Obtener los períodos académicos que representan los bimestres
  async getBimestres(periodoId: string): Promise<Bimestre[]> {
    try {

      // Primero, obtener el período padre (año académico)
      const periodoPadre = await api.get(`/academic-periods/${periodoId}`);

      // Luego, obtener todos los períodos hijos (bimestres)
      const response = await api.get(`/academic-periods?parentId=${periodoId}`);
      console.log('📊 [dashboardService] Períodos (bimestres) obtenidos:', response.data);

      if (!response.data || !Array.isArray(response.data)) {
        console.log('ℹ️ [dashboardService] No se encontraron períodos (bimestres)');
        return [];
      }

      // Ordenar por fecha de inicio
      const periodosOrdenados = [...response.data].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      // Mapear la respuesta al tipo Bimestre
      return periodosOrdenados.map((periodo: any, index: number) => {
        const hoy = new Date();
        const fechaInicio = new Date(periodo.startDate);
        const fechaFin = new Date(periodo.endDate);
        const hoyMs = hoy.getTime();
        const fechaInicioMs = fechaInicio.getTime();
        const fechaFinMs = fechaFin.getTime();

        // Usar el status del backend, pero también verificar las fechas para completados automáticos
        let estado: 'completado' | 'activo' | 'proximo' = 'proximo';
        let progreso = 0;

        // Mapear el status del backend al estado del frontend
        switch (periodo.status) {
          case 'active':
            // Si está activo pero la fecha ya pasó, mostrar como completado
            if (hoyMs > fechaFinMs) {
              estado = 'completado';
              progreso = 100;
            } else {
              estado = 'activo';
              // Calcular progreso solo si está activo y en fecha
              if (hoyMs >= fechaInicioMs && hoyMs <= fechaFinMs) {
                const duracionTotal = fechaFinMs - fechaInicioMs;
                const tiempoTranscurrido = hoyMs - fechaInicioMs;
                progreso = Math.min(99, Math.max(1, Math.round((tiempoTranscurrido / duracionTotal) * 100)));
              } else {
                progreso = 0; // Aún no empieza
              }
            }
            break;
          case 'completed':
            estado = 'completado';
            progreso = 100;
            break;
          case 'cancelled':
            estado = 'completado'; // Tratar cancelados como completados en el frontend
            progreso = 100;
            break;
          case 'upcoming':
          default:
            // Si está marcado como upcoming pero la fecha ya pasó, mostrar como completado
            if (hoyMs > fechaFinMs) {
              estado = 'completado';
              progreso = 100;
            } else if (hoyMs >= fechaInicioMs && hoyMs <= fechaFinMs) {
              estado = 'activo'; // Si está en rango de fechas, mostrar como activo
              const duracionTotal = fechaFinMs - fechaInicioMs;
              const tiempoTranscurrido = hoyMs - fechaInicioMs;
              progreso = Math.min(99, Math.max(1, Math.round((tiempoTranscurrido / duracionTotal) * 100)));
            } else {
              estado = 'proximo';
              progreso = 0;
            }
            break;
        }

        return {
          id: periodo.id,
          numero: index + 1,
          nombre: periodo.name || `Bimestre ${index + 1}`,
          estado,
          fechaInicio: periodo.startDate,
          fechaFin: periodo.endDate,
          progreso,
          descripcion: periodo.description
        };
      });

    } catch (error: any) {
      console.error('❌ [dashboardService] Error al obtener los períodos (bimestres):', error);

      if (error.response) {
        if (error.response.status === 404) {
          console.log('ℹ️ [dashboardService] No se encontraron períodos (bimestres)');
        } else {
          console.error('📡 [dashboardService] Error del servidor:', {
            status: error.response.status,
            data: error.response.data
          });
        }
      } else if (error.request) {
        console.error('🔌 [dashboardService] No se recibió respuesta del servidor');
      } else {
        console.error('⚠️ [dashboardService] Error al configurar la solicitud:', error.message);
      }

      return [];
    }
  },

  async getAllGrados(): Promise<any[]> {
    try {
      // Obtener todos los estudiantes para extraer los grados únicos
      const estudiantesResponse = await api.get('/students');
      
      let todosEstudiantes: any[] = [];
      if (Array.isArray(estudiantesResponse.data)) {
        todosEstudiantes = estudiantesResponse.data;
      } else if (estudiantesResponse.data?.data) {
        todosEstudiantes = Array.isArray(estudiantesResponse.data.data)
          ? estudiantesResponse.data.data
          : [];
      }

      // Extraer grados únicos de todos los estudiantes
      const gradosUnicos = new Set<string>();
      const gradosList: any[] = [];

      todosEstudiantes.forEach((estudiante: any) => {
        if (estudiante.grados) {
          let gradosEstudiante: any[] = [];
          
          if (typeof estudiante.grados === 'string') {
            try {
              gradosEstudiante = JSON.parse(estudiante.grados);
            } catch (e) {
              console.error('Error parsing grados JSON:', e);
              return;
            }
          } else if (Array.isArray(estudiante.grados)) {
            gradosEstudiante = estudiante.grados;
          }

          gradosEstudiante.forEach((grado: any) => {
            if (grado && !gradosUnicos.has(grado)) {
              gradosUnicos.add(grado);
              
              // Parsear el grado para extraer componentes
              const match = grado.match(/^(\d+)°\s+(.+?)(?:\s+([A-Z]))?$/);
              if (match) {
                gradosList.push({
                  grado: match[1],
                  nivel: match[2],
                  seccion: match[3] || ''
                });
              } else {
                // Si no coincide con el patrón, agregar como está
                gradosList.push({
                  grado: grado,
                  nivel: grado,
                  seccion: ''
                });
              }
            }
          });
        }
      });

      // Ordenar grados numéricamente y luego alfabéticamente
      gradosList.sort((a, b) => {
        const numA = parseInt(a.grado) || 0;
        const numB = parseInt(b.grado) || 0;
        
        if (numA !== numB) {
          return numA - numB;
        }
        
        return a.nivel.localeCompare(b.nivel);
      });

      console.log('🔍 [getAllGrados] Grados encontrados:', gradosList);
      return gradosList;
    } catch (error) {
      console.error('Error al obtener todos los grados:', error);
      return [];
    }
  },

  async getGradosConMaterias(): Promise<GradoConMaterias[]> {
    try {
      const teacherProfile = await this.getTeacherProfile();

      if (!teacherProfile) {
        console.error('No se pudo obtener el perfil del docente');
        return [];
      }

      const materiasDocente = teacherProfile.materias || [];

      if (teacherProfile?.perfilDocente?.grados?.length) {
        const gradosAsignados = teacherProfile.perfilDocente.grados;

        const estudiantesResponse = await api.get('/students');

        let todosEstudiantes: any[] = [];
        if (Array.isArray(estudiantesResponse.data)) {
          todosEstudiantes = estudiantesResponse.data;
        } else if (estudiantesResponse.data?.data) {
          todosEstudiantes = Array.isArray(estudiantesResponse.data.data)
            ? estudiantesResponse.data.data
            : [];
        } else if (estudiantesResponse.data) {
          todosEstudiantes = [estudiantesResponse.data];
        }

        const gradosConMaterias = await Promise.all(gradosAsignados.map(async (gradoNombre) => {
          const gradoExacto = gradoNombre.trim();

          const estudiantesEnGrado = todosEstudiantes.filter((est: any) => {
            if (!est || !est.grados) return false;
            
            // Parsear grados si viene como string JSON
            let gradosEstudiante: any[] = [];
            if (typeof est.grados === 'string') {
              try {
                gradosEstudiante = JSON.parse(est.grados);
              } catch (e) {
                console.error('Error parsing grados JSON:', e);
                return false;
              }
            } else if (Array.isArray(est.grados)) {
              gradosEstudiante = est.grados;
            }

            // Debug: mostrar lo que estamos comparando
            console.log('🔍 Debug - Estudiante:', est.nombre, 'Grados:', gradosEstudiante, 'Buscando:', gradoExacto);

            return gradosEstudiante.some((g: any) => {
              const grado = typeof g === 'string' ? g.trim() : (g.nombre || '').trim();
              console.log('🔍 Comparando:', `"${grado}" === "${gradoExacto}"`, grado === gradoExacto);
              return grado === gradoExacto;
            });
          });

          // Parsear el nombre del grado para obtener nivel y sección
          // Formatos esperados: "1° Primaria A", "4° Bachillerato en Ciencias y Letras", "Kinder A"
          const match = gradoExacto.match(/^(\d+)°\s+(.+?)(?:\s+([A-Z]))?$/);
          
          // Si no hay sección al final, intentar sin capturar sección
          const matchWithoutSection = gradoExacto.match(/^(\d+)°\s+(.+)$/);

          let nivel = '';
          let seccion = '';

          if (match) {
            // Si el formato es "1° Básico A", queremos que grado sea "1"
            // El nivel será "Básico" y la sección "A"
            const gradoNumero = match[1]; // "1"
            nivel = match[2]; // "Básico"
            seccion = match[3] || 'A';
          } else if (matchWithoutSection) {
            // Si el formato es "4° Bachillerato en Ciencias y Letras" sin sección
            const gradoNumero = matchWithoutSection[1]; // "4"
            nivel = matchWithoutSection[2]; // "Bachillerato en Ciencias y Letras"
            seccion = 'A'; // Sección por defecto
          } else {
            // Fallback para otros formatos
            const seccionMatch = gradoExacto.match(/\s+([A-Z])$/);
            seccion = seccionMatch ? seccionMatch[1] : 'A';
            nivel = gradoExacto.replace(/\s+[A-Z]$/, '').trim();
          }

          // Procesar materias - eliminar duplicados si el backend no lo hace
          const materiasDelGrado: any[] = [];
          
          if (materiasDocente.length > 0) {
            // Deduplicar materias por ID
            const materiasUnicas = new Map();
            
            materiasDocente.forEach((materia: any) => {
              // Manejar tanto estructura antigua como nueva
              const materiaData = materia.materia || materia;
              
              if (materiaData && materiaData.id) {
                const materiaId = materiaData.id;
                
                // Si ya existe esta materia, no agregarla de nuevo
                if (!materiasUnicas.has(materiaId)) {
                  console.log('🔍 [Dashboard] Agregando materia única:', {
                    id: materiaData.id,
                    nombre: materiaData.nombre,
                    tienePeriodosAsignados: !!materia.periodosAsignados
                  });
                  
                  materiasUnicas.set(materiaId, {
                    ...materiaData,
                    seccion: seccion,
                    docenteId: teacherProfile.id,
                    grado: gradoExacto,
                    periodosAsignados: materia.periodosAsignados || []
                  });
                } else {
                  console.log('⚠️ [Dashboard] Ignorando materia duplicada:', materiaData.nombre);
                }
              }
            });
            
            // Convertir el Map a array
            materiasDelGrado.push(...materiasUnicas.values());
          }

          // Si logramos extraer un número de grado (ej: "1"), usamos ese como el grado a mostrar
          // Si no (ej: "Kinder"), usamos el nombre completo
          const gradoDisplay = match ? match[1] : (matchWithoutSection ? matchWithoutSection[1] : gradoExacto.replace(/\s+[A-Z]$/, '').trim());

          return {
            grado: gradoDisplay, // Usamos el grado formateado (ej: "1" o "Kinder")
            nivel,
            seccion,
            materias: materiasDelGrado,
            totalEstudiantes: estudiantesEnGrado.length,
            estudiantes: estudiantesEnGrado
          };
        }));

        return gradosConMaterias;
      }

      return [];

    } catch (error) {
      console.error('Error al obtener los grados con materias:', error);
      return [];
    }
  },

  async getEstadisticasBimestrales(): Promise<{
    bimestreActual: EstadisticasBimestre;
    bimestres: EstadisticasBimestre[];
  }> {
    try {
      // Datos de ejemplo hasta que se implemente el endpoint real
      const hoy = new Date();
      const bimestreActual = 2; // Ejemplo: 2do bimestre

      return {
        bimestreActual: {
          numero: bimestreActual,
          nombre: `Bimestre ${bimestreActual}`,
          fechaInicio: new Date(hoy.getFullYear(), (bimestreActual - 1) * 3, 1).toISOString(),
          fechaFin: new Date(hoy.getFullYear(), (bimestreActual - 1) * 3 + 3, 0).toISOString(),
          estado: 'activo',
          promedio: 0 // Se calculará con los datos reales
        },
        bimestres: [1, 2, 3, 4].map(num => ({
          numero: num,
          nombre: `Bimestre ${num}`,
          fechaInicio: new Date(hoy.getFullYear(), (num - 1) * 3, 1).toISOString(),
          fechaFin: new Date(hoy.getFullYear(), (num - 1) * 3 + 3, 0).toISOString(),
          estado:
            num < bimestreActual ? 'completado' :
              num === bimestreActual ? 'activo' : 'pendiente',
          promedio: num < bimestreActual ? Math.floor(Math.random() * 20) + 70 : undefined
        }))
      };
    } catch (error) {
      console.error('Error al obtener estadísticas bimestrales:', error);
      throw error;
    }
  },

  async getPromedioBimestre(materiaId: number, bimestre: number): Promise<number | null> {
    try {
      // Implementar lógica para obtener el promedio de una materia en un bimestre específico
      // Esto es un ejemplo, ajusta según tu API
      const response = await api.get<{ promedio: number }>(`/materias/${materiaId}/bimestre/${bimestre}/promedio`);
      return response.data?.promedio || null;
    } catch (error) {
      console.error(`Error al obtener promedio del bimestre ${bimestre} para la materia ${materiaId}:`, error);
      return null;
    }
  },

  async getTeacherProfile(): Promise<TeacherProfile | null> {
    try {
      const response = await api.get('/auth/me');
      console.log('Perfil del docente recibido:', response.data);

      // Asegurarse de que la respuesta tenga la estructura esperada
      const profileData = response.data?.data || response.data;
      if (!profileData) {
        console.error('No se pudo obtener el perfil del docente');
        return null;
      }

      // Asegurarse de que perfilDocente exista
      const perfilDocente = profileData.perfilDocente || {
        id: '',
        userId: profileData.id || '',
        contactoEmergencia: '',
        telefonoEmergencia: '',
        status: 'active',
        grados: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Asegurarse de que grados sea un array de strings
      const grados = Array.isArray(perfilDocente.grados)
        ? perfilDocente.grados.map((g: any) => String(g || '').trim()).filter(Boolean)
        : [];

      // Crear el perfil con los datos formateados
      const teacherProfile: TeacherProfile = {
        id: profileData.id || '',
        userId: profileData.userId || '',
        email: profileData.email || '',
        nombre: profileData.nombre || '',
        apellido: profileData.apellido || '',
        perfilDocente: {
          ...perfilDocente,
          grados
        },
        materias: Array.isArray(profileData.materias) ? profileData.materias : []
      };

      return teacherProfile;
    } catch (error) {
      console.error('Error al obtener el perfil del docente:', error);
      return null;
    }
  },

  async getEstudiantesPorGrado(params: {
    grado: number;
    nivel?: string;
    seccion?: string;
  }): Promise<Estudiante[]> {
    try {
      // Formatear el grado según el formato esperado por el backend
      // Si el nivel ya contiene el grado completo, usarlo directamente
      let formattedGrado = params.nivel || '';
      if (!formattedGrado.includes(`${params.grado}°`)) {
        formattedGrado = `${params.grado}° ${params.nivel || ''}`.trim();
      }
      // Solo añadir sección si no es una sección por defecto "A" y el nivel no ya termina con letra
      if (params.seccion && params.seccion !== 'A' && !/[A-Z]$/.test(formattedGrado)) {
        formattedGrado += ` ${params.seccion}`;
      }
      formattedGrado = formattedGrado.trim();
      
      console.log('🔍 getEstudiantesPorGrado - formattedGrado:', formattedGrado);
      
      // Intentar con el endpoint especializado primero
      try {
        const response = await api.get('/students/por-grado', {
          params: {
            grado: formattedGrado,
            nivel: params.nivel,
            seccion: params.seccion
          },
          paramsSerializer: (params) => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
              }
            });
            return searchParams.toString();
          }
        });

        console.log('🔍 getEstudiantesPorGrado - API Response:', response.data);
        console.log('🔍 getEstudiantesPorGrado - Response length:', Array.isArray(response.data) ? response.data.length : 'not array');

        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data;
        }
      } catch (error) {
        console.log('🔍 getEstudiantesPorGrado - Specialized endpoint failed, trying general endpoint');
      }

      // Si el endpoint especializado no funciona, usar el endpoint general y filtrar manualmente
      console.log('🔍 getEstudiantesPorGrado - Using general /students endpoint');
      const allStudentsResponse = await api.get('/students');
      
      let allStudents: any[] = [];
      if (Array.isArray(allStudentsResponse.data)) {
        allStudents = allStudentsResponse.data;
      } else if (allStudentsResponse.data?.data) {
        allStudents = Array.isArray(allStudentsResponse.data.data)
          ? allStudentsResponse.data.data
          : [];
      } else if (allStudentsResponse.data) {
        allStudents = [allStudentsResponse.data];
      }

      console.log('🔍 getEstudiantesPorGrado - Total students from general endpoint:', allStudents.length);

      // Filtrar manualmente por el grado exacto
      const filteredStudents = allStudents.filter((est: any) => {
        if (!est || !est.grados) return false;
        
        // Parsear grados si viene como string JSON
        let gradosEstudiante: any[] = [];
        if (typeof est.grados === 'string') {
          try {
            gradosEstudiante = JSON.parse(est.grados);
          } catch (e) {
            console.error('Error parsing grados JSON:', e);
            return false;
          }
        } else if (Array.isArray(est.grados)) {
          gradosEstudiante = est.grados;
        }

        const hasGrado = gradosEstudiante.some((g: any) => {
          const grado = typeof g === 'string' ? g.trim() : (g.nombre || '').trim();
          return grado === formattedGrado;
        });

        if (hasGrado) {
          console.log('🔍 getEstudiantesPorGrado - Found student:', est.nombre, 'with grade:', formattedGrado);
        }

        return hasGrado;
      });

      console.log('🔍 getEstudiantesPorGrado - Final filtered count:', filteredStudents.length);
      return filteredStudents;

    } catch (error) {
      console.error('Error al obtener estudiantes por grado:', error);
      throw error;
    }
  },

  // Obtener estudiante con todas sus calificaciones
  getEstudianteConCalificaciones: async (id: string): Promise<EstudianteConCalificaciones> => {
    try {
      const response = await api.get(`/students/${id}/calificaciones`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estudiante con calificaciones:', error);
      throw error;
    }
  },
};
