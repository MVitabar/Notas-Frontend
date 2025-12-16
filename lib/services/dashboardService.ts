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
  estado: string;
  materia: MateriaBase;
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
      console.log('🔍 [dashboardService] Obteniendo período académico actual...');
      const response = await api.get('/academic-periods/current');
      console.log('📊 [dashboardService] Respuesta de la API:', response.data);

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

  // Obtener los períodos académicos que representan los bimestres
  async getBimestres(periodoId: string): Promise<Bimestre[]> {
    try {
      console.log(`🔍 [dashboardService] Obteniendo períodos académicos (bimestres) para el año...`);

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

        // Determinar el estado del período
        let estado: 'completado' | 'activo' | 'proximo' = 'proximo';
        let progreso = 0;

        if (hoyMs >= fechaInicioMs && hoyMs <= fechaFinMs) {
          // Período activo
          estado = 'activo';
          const duracionTotal = fechaFinMs - fechaInicioMs;
          const tiempoTranscurrido = hoyMs - fechaInicioMs;
          progreso = Math.min(99, Math.max(1, Math.round((tiempoTranscurrido / duracionTotal) * 100)));
        } else if (hoyMs > fechaFinMs) {
          // Período completado
          estado = 'completado';
          progreso = 100;
        } else {
          // Período próximo (por defecto)
          progreso = 0;
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
            const gradosEstudiante = Array.isArray(est.grados) ? est.grados : [];

            return gradosEstudiante.some((g: any) => {
              const grado = typeof g === 'string' ? g.trim() : (g.nombre || '').trim();
              return grado === gradoExacto;
            });
          });

          const materiasDelGrado = materiasDocente
            .filter((m: any) => m && m.materia)
            .map((m: any) => ({
              ...m.materia,
              seccion: m.seccion || 'A',
              docenteId: teacherProfile.id,
              grado: gradoExacto,
              periodoAcademico: m.periodoAcademico,
              estado: m.estado,
              horario: m.horario
            }));

          // Parsear el nombre del grado para obtener nivel y sección
          // Formatos esperados: "1° Primaria A", "4° Bachillerato...", "Kinder A"
          const match = gradoExacto.match(/^(\d+)°\s+(.+?)(?:\s+([A-Z]))?$/);

          let nivel = '';
          let seccion = '';

          if (match) {
            // Si el formato es "1° Básico A", queremos que grado sea "1"
            // El nivel será "Básico" y la sección "A"
            const gradoNumero = match[1]; // "1"
            nivel = match[2]; // "Básico"
            seccion = match[3] || 'A';

            // Actualizamos el grado exacto para que sea solo el número si es un formato estándar
            // Esto evita que en el frontend se muestre "1° Básico A° Básico"
            // Pero mantenemos el original para las referencias de materias si es necesario
          } else {
            // Fallback para otros formatos
            const seccionMatch = gradoExacto.match(/\s+([A-Z])$/);
            seccion = seccionMatch ? seccionMatch[1] : 'A';
            nivel = gradoExacto.replace(/\s+[A-Z]$/, '').trim();
          }

          // Si logramos extraer un número de grado (ej: "1"), usamos ese como el grado a mostrar
          // Si no (ej: "Kinder"), usamos el nombre completo
          const gradoDisplay = match ? match[1] : gradoExacto.replace(/\s+[A-Z]$/, '').trim();

          if (materiasDelGrado.length === 0 && materiasDocente.length > 0) {
            materiasDocente.forEach((m: any) => {
              if (m && m.materia) {
                materiasDelGrado.push({
                  ...m.materia,
                  seccion: m.seccion || seccion,
                  docenteId: m.docenteId || teacherProfile.id,
                  grado: gradoExacto
                });
              }
            });
          }

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
  // Obtener estudiantes por grado, nivel y sección
  getEstudiantesPorGrado: async (params: {
    grado: number;
    nivel?: string;
    seccion?: string;
  }): Promise<Estudiante[]> => {
    try {
      console.log('🔍 [dashboardService] Obteniendo estudiantes por grado con params:', JSON.stringify(params, null, 2));

      // Asegurarse de que el grado sea un número
      const queryParams: Record<string, string> = {
        grado: params.grado.toString()
      };

      // Agregar nivel si está presente
      if (params.nivel) {
        queryParams.nivel = params.nivel;
      }

      // Agregar sección si está presente
      if (params.seccion) {
        queryParams.seccion = params.seccion;
      }

      console.log('📡 [dashboardService] Enviando request a /students/por-grado con queryParams:', queryParams);
      
      // Log the full request configuration
      const requestConfig = {
        method: 'get',
        url: '/students/por-grado',
        params: queryParams,
        baseURL: api.defaults.baseURL
      };
      console.log('🔧 [dashboardService] Configuración completa de la petición:', JSON.stringify(requestConfig, null, 2));

      const response = await api.get('/students/por-grado', {
        params: queryParams,
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

      console.log('📥 [dashboardService] Respuesta de la API:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data ? `Array de ${Array.isArray(response.data) ? response.data.length : 'datos no-array'}` : 'Sin datos'
      });

      if (!Array.isArray(response.data)) {
        console.warn('⚠️ [dashboardService] La respuesta no es un array:', response.data);
        return [];
      }

      console.log(`✅ [dashboardService] Estudiantes obtenidos: ${response.data.length}`);
      return response.data;
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
  // ... other methods
}
