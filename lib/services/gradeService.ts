import { api } from '@/lib/api';

export type TipoCalificacion = 'NUMERICA' | 'CONCEPTUAL';
export type ValorConceptual = 'DESTACA' | 'AVANZA' | 'NECESITA_MEJORAR' | 'INSATISFACTORIO';
export type TipoMateria = 'REGULAR' | 'EXTRA';
export type ValorExtraescolar = 'SOBRESALIENTE' | 'SATISFACTORIO' | 'EN_PROCESO' | 'NO_LOGRO' | 'NO_APLICA';

export interface CalificacionPorGradoResponse {
  estudiante: {
    id: string;
    nombre: string;
    apellido: string;
    grado: string;
    dni?: string;  // Add DNI field
  };
  calificaciones: Array<{
    id: string;
    calificacion: number | null;
    tipoCalificacion: 'NUMERICA' | 'CONCEPTUAL';
    valorConceptual: ValorConceptual | null;
    fecha: string;
    comentario: string | null;
    tipoEvaluacion: string;
    materia: {
      id: string;
      nombre: string;
      tipoMateria: string;
    };
    periodo: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
    };
    docente: {
      id: string;
      nombre: string;
      apellido: string;
    };
  }>;
}

export interface CalificacionBase {
  id: string;
  estudianteId: string;
  materiaId: string;
  periodoId: string;
  docenteId: string;
  tipoCalificacion: TipoCalificacion;
  tipoEvaluacion: string;
  calificacion: number | null;
  valorConceptual: ValorConceptual | null;
  comentario: string | null;
  fecha: string;
}

export interface CalificacionResponse extends CalificacionBase {
  estudiante: {
    id: string;
    nombre: string;
    apellido: string;
    dni?: string;
    grados?: string[]; // Array of grades the student is enrolled in (e.g., ["2° Básico A"])
  };
  materia: {
    id: string;
    nombre: string;
  };
  periodo: {
    id: string;
    name: string;
  };
  docente: {
    id: string;
    nombre: string;
    apellido: string;
  };
  nombreMateria?: string;
  esExtraescolar?: boolean;
}

// Función para verificar si el token ha expirado
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    console.error('Error al verificar token:', e);
    return true;
  }
}

export interface CreateCalificacionRequest {
  userMateriaId: string;
  estudianteId: string;
  periodoId: string;
  tipoCalificacion: TipoCalificacion;
  tipoEvaluacion: string;
  calificacion?: number;
  valorConceptual?: ValorConceptual;
  valorExtraescolar?: ValorExtraescolar;
  comentario?: string;
  fecha?: string;
  unidad?: string; // Unidad asignada (u1, u2, u3, u4)
  esExtraescolar?: boolean;
  nombreMateria?: string;
  // For backward compatibility
  materiaId?: string;
  docenteId?: string;
}

export interface UpdateCalificacionRequest {
  tipoCalificacion?: TipoCalificacion;
  tipoEvaluacion?: string;
  calificacion?: number;
  valorConceptual?: ValorConceptual;
  comentario?: string;
  materiaId?: string;
  periodoId?: string;
  unidad?: string; // Unidad asignada (u1, u2, u3, u4)
  esExtraescolar?: boolean;
  nombreMateria?: string;
}

export interface DeleteCalificacionResponse {
  id: string;
  mensaje: string;
}

export interface CalificacionPorEstudiante {
  id: string;
  materiaId: string;
  periodoId: string;
  tipoCalificacion: TipoCalificacion;
  tipoEvaluacion: string;
  calificacion: number | null;
  valorConceptual: ValorConceptual | null;
  comentario: string | null;
  esExtraescolar: boolean; // Agregar campo esExtraescolar
  unidad: string; // Agregar campo unidad
  materia: {
    id: string;
    nombre: string;
  };
  periodo: {
    id: string;
    name: string;
  };
  docente: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

// Función para validar si un valor es un ValorExtraescolar válido
function isValidExtraescolarValue(value: any): value is ValorExtraescolar {
  return ['SOBRESALIENTE', 'SATISFACTORIO', 'EN_PROCESO', 'NO_LOGRO', 'NO_APLICA'].includes(value);
}

// Extend the CreateCalificacionRequest interface to make userMateriaId optional
interface CreateExtracurricularRequest {
  estudianteId: string;
  materiaId: string;
  periodoId: string;
  valorConceptual: ValorConceptual;
  comentario?: string;
  nombreMateria: string;
}

export interface IGradeService {
  getByStudent(estudianteId: string, periodoId?: string): Promise<CalificacionPorEstudiante[]>;
  create(data: CreateCalificacionRequest): Promise<CalificacionResponse>;
  update(id: string, data: UpdateCalificacionRequest): Promise<CalificacionResponse>;
  delete(id: string): Promise<void>;
  getByPeriodo(periodoId: string): Promise<CalificacionResponse[]>;
  getByMateria(materiaId: string): Promise<CalificacionResponse[]>;
  getByMateriaAndPeriodo(materiaId: string, tipoEvaluacionId: string, periodoId: string): Promise<CalificacionResponse[]>;
  getByEstudianteAndMateria(estudianteId: string, materiaId: string): Promise<CalificacionResponse[]>;
  getByMateriaGradoPeriodo(
    materiaId: string,
    grado: string,
    periodoId: string,
    nivel?: string
  ): Promise<CalificacionPorGradoResponse[]>;
  createExtraescolar(data: CreateCalificacionRequest): Promise<CalificacionResponse>;
  createExtracurricularGrade(data: CreateExtracurricularRequest): Promise<CalificacionResponse>;
  updateExtracurricularGrade(id: string, data: { valorConceptual: ValorConceptual; comentario?: string; nombreMateria?: string }): Promise<CalificacionResponse>;
  saveHabitGrades(estudianteId: string, data: SaveHabitGradesRequest): Promise<void>;
  getHabitGrades(estudianteId: string, periodoId: string): Promise<any[]>;
}

export interface HabitGradeRequest {
  evaluacionHabitoId: string;
  u1?: string | null;
  u2?: string | null;
  u3?: string | null;
  u4?: string | null;
  comentario?: string | null;
}

export interface SaveHabitGradesRequest {
  periodoId: string;
  calificaciones: HabitGradeRequest[];
}

// Función helper para detectar nombres extracurriculares
function esNombreExtracurricular(nombre: string): boolean {
  const extracurricularNames = [
    'moral cristiana',
    'comprensión de lectura',
    'lógica matemática',
    'programa de lectura',
    'razonamiento verbal'
  ];
  return extracurricularNames.some(name => 
    nombre.toLowerCase().includes(name)
  );
}

const gradeService: IGradeService = {
  // Obtener calificaciones de un estudiante
  async getByStudent(estudianteId: string, periodoId?: string): Promise<CalificacionPorEstudiante[]> {
    try {
      const params = new URLSearchParams();
      console.log('🔍 gradeService.getByStudent - params iniciales:', params.toString());
      console.log('🔍 gradeService.getByStudent - periodoId recibido:', periodoId);
      
      if (periodoId) {
        params.append('periodoId', periodoId);
        console.log('🔍 gradeService.getByStudent - params después de append:', params.toString());
      }

      const fullUrl = params.toString() 
  ? `/calificaciones/estudiante/${estudianteId}?${params.toString()}`
  : `/calificaciones/estudiante/${estudianteId}`;
console.log('🔍 gradeService.getByStudent - URL completa:', fullUrl);

      const response = await api.get<CalificacionPorEstudiante[]>(fullUrl);
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('No se encontraron calificaciones para el estudiante');
        return [];
      }
      console.error('Error al obtener calificaciones del estudiante:', error);
      throw error;
    }
  },

  // Obtener calificaciones por materia
  async getByMateria(materiaId: string, periodoId?: string): Promise<CalificacionResponse[]> {
    try {
      if (!periodoId) {
        throw new Error('Se requiere un periodoId para obtener calificaciones por materia');
      }

      // Usar el nuevo endpoint con parámetros por defecto
      const response = await this.getByMateriaGradoPeriodo(
        materiaId,
        '', // grado se manejará en el backend
        periodoId,
        'Básico' // nivel por defecto
      );

      // Transformar la respuesta al formato esperado
      return response.flatMap(item =>
        item.calificaciones.map(cal => ({
          id: cal.id,
          estudianteId: item.estudiante.id,
          materiaId: cal.materia.id,
          periodoId: cal.periodo.id,
          docenteId: cal.docente.id,
          tipoCalificacion: cal.tipoCalificacion,
          tipoEvaluacion: cal.tipoEvaluacion,
          calificacion: cal.calificacion,
          valorConceptual: cal.valorConceptual,
          comentario: cal.comentario,
          fecha: cal.fecha,
          estudiante: {
            id: item.estudiante.id,
            nombre: item.estudiante.nombre,
            apellido: item.estudiante.apellido,
            grados: [item.estudiante.grado]
          },
          materia: cal.materia,
          periodo: cal.periodo,
          docente: cal.docente
        }))
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error al obtener calificaciones por materia:', error);
      throw error;
    }
  },

  // Crear una nueva calificación
  async createExtraescolar(calificacion: CreateCalificacionRequest): Promise<CalificacionResponse> {
    // Validar que sea una calificación extraescolar
    if (!calificacion.esExtraescolar) {
      throw new Error('Este método es solo para calificaciones extraescolares');
    }

    // Validar que se proporcione un valor extraescolar
    if (!calificacion.valorExtraescolar || !isValidExtraescolarValue(calificacion.valorExtraescolar)) {
      throw new Error('El valor para la actividad extraescolar es requerido y debe ser uno de: SOBRESALIENTE, SATISFACTORIO, EN_PROCESO, NO_LOGRO, NO_APLICA');
    }

    // Asegurarse de que el tipo de calificación sea CONCEPTUAL para actividades extraescolares
    const calificacionExtraescolar = {
      ...calificacion,
      tipoCalificacion: 'CONCEPTUAL' as const,
      valorConceptual: calificacion.valorExtraescolar as unknown as ValorConceptual, // Conversión segura ya que son valores compatibles
      esExtraescolar: true
    };

    return this.create(calificacionExtraescolar);
  },

  async create(calificacion: CreateCalificacionRequest): Promise<CalificacionResponse> {
    try {
      // Verificar si hay un token de autenticación
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!authToken) {
        throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      // Validar campos requeridos
      const requiredFields: (keyof CreateCalificacionRequest)[] = ['estudianteId', 'userMateriaId', 'periodoId', 'tipoCalificacion', 'tipoEvaluacion'];
      const missingFields = requiredFields.filter(field => !calificacion[field]);

      if (missingFields.length > 0) {
        throw new Error(`Los siguientes campos son requeridos: ${missingFields.join(', ')}`);
      }

      // Validar que el tipo de calificación sea válido
      if (!['NUMERICA', 'CONCEPTUAL'].includes(calificacion.tipoCalificacion)) {
        throw new Error('El tipo de calificación debe ser NUMERICA o CONCEPTUAL');
      }

      // Validar que se proporcione un valor para el tipo de calificación seleccionado
      if (calificacion.tipoCalificacion === 'NUMERICA' && calificacion.calificacion === undefined) {
        throw new Error('La calificación numérica es requerida');
      }

      if (calificacion.tipoCalificacion === 'CONCEPTUAL' && !calificacion.valorConceptual) {
        throw new Error('El valor conceptual es requerido');
      }

      // Crear el objeto de datos a enviar
      const requestData: any = {
        estudianteId: calificacion.estudianteId.trim(),
        userMateriaId: calificacion.userMateriaId.trim(),
        periodoId: calificacion.periodoId.trim(),
        tipoCalificacion: calificacion.tipoCalificacion,
        tipoEvaluacion: calificacion.tipoEvaluacion.trim(),
        comentario: calificacion.comentario || undefined,
        unidad: calificacion.unidad || undefined, // Agregar el campo unidad
        esExtraescolar: calificacion.esExtraescolar || false, // Agregar el campo esExtraescolar
        nombreMateria: calificacion.nombreMateria || undefined // Agregar el campo nombreMateria
      };

      // No incluir la fecha ya que el servidor la genera automáticamente

      // Agregar el valor de la calificación según el tipo
      if (calificacion.tipoCalificacion === 'NUMERICA') {
        requestData.calificacion = Number(calificacion.calificacion);
      } else {
        requestData.valorConceptual = calificacion.valorConceptual;
      }

      // Add docenteId if it exists (for backward compatibility)
      if (calificacion.docenteId) {
        requestData.docenteId = calificacion.docenteId.trim();
      }

      console.log('=== INICIO DE SOLICITUD ===');
      console.log('URL:', `${process.env.NEXT_PUBLIC_API_URL}/calificaciones`);
      console.log('Método: POST');
      console.log('Datos:', JSON.stringify(requestData, null, 2));
      console.log('🔍 Campo unidad en requestData:', requestData.unidad);

      // Verificar el token de autenticación
      console.log('Token en localStorage:', authToken ? 'Encontrado' : 'No encontrado');

      if (authToken) {
        try {
          const tokenPayload = JSON.parse(atob(authToken.split('.')[1]));
          console.log('Token JWT decodificado:', JSON.stringify(tokenPayload, null, 2));
        } catch (e) {
          console.error('Error al decodificar el token:', e);
        }
      }

      // Realizar la solicitud con manejo detallado de errores
      console.log('Enviando solicitud...');
      try {
        const response = await api.post<CalificacionResponse>('/calificaciones', requestData);

        console.log('=== RESPUESTA EXITOSA ===');
        console.log('Status:', response.status);
        console.log('Headers:', response.headers);
        console.log('Datos de respuesta:', response.data);

        return response.data;
      } catch (error: any) {
        console.error('=== ERROR EN LA SOLICITUD ===');
        console.error('Mensaje de error:', error.message);

        if (error.response) {
          // El servidor respondió con un estado de error
          console.error('Detalles del error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            url: error.config?.url,
            method: error.config?.method,
            requestHeaders: error.config?.headers,
            responseHeaders: error.response.headers,
            responseData: error.response.data,
            requestData: error.config?.data
          });

          // Si es un error 401, verificar el token
          if (error.response.status === 401) {
            const token = localStorage.getItem('token');
            console.error('Error 401 - Token verificación:', {
              tokenExists: !!token,
              tokenLength: token?.length,
              tokenPrefix: token?.substring(0, 10) + '...',
              tokenExpired: token ? isTokenExpired(token) : 'No token'
            });

            console.error('Error de autenticación. Token inválido o expirado.');
            // Limpiar el token si está vencido
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              // Redirigir a la página de login
              window.location.href = '/login?session_expired=true';
            }
          }
        } else if (error.request) {
          console.error('No se recibió respuesta del servidor:', error.request);
        } else {
          console.error('Error al configurar la solicitud:', error.message);
        }

        // Relanzar el error con un mensaje más descriptivo
        const errorMessage = error.response?.data?.message ||
          error.message ||
          'Error al crear la calificación. Por favor, inténtalo de nuevo.';

        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error inesperado al procesar la solicitud:', error);
      throw new Error('Ocurrió un error inesperado al procesar la solicitud');
    }
  },

  // Actualizar una calificación existente
  async update(id: string, calificacion: UpdateCalificacionRequest): Promise<CalificacionResponse> {
    try {
      console.log('Iniciando actualización de calificación con ID:', id);
      console.log('Datos de la calificación a actualizar:', calificacion);

      // Validar que los campos sean consistentes con el tipo de calificación
      if (calificacion.tipoCalificacion === 'NUMERICA' && calificacion.calificacion === undefined) {
        throw new Error('La calificación numérica es requerida');
      }

      if (calificacion.tipoCalificacion === 'CONCEPTUAL' && !calificacion.valorConceptual) {
        throw new Error('El valor conceptual es requerido');
      }

      // Preparar el cuerpo de la petición según el formato requerido
      const requestBody = {
        calificacion: calificacion.calificacion,
        comentario: calificacion.comentario || '',
        tipoCalificacion: calificacion.tipoCalificacion,
        unidad: calificacion.unidad || undefined, // Agregar el campo unidad
        ...(calificacion.valorConceptual && { valorConceptual: calificacion.valorConceptual }),
        ...(calificacion.nombreMateria && { nombreMateria: calificacion.nombreMateria })
        // 🔥 REMOVIDO: esExtraescolar - el backend no lo acepta para actualizaciones
      };

      console.log('Enviando petición PUT a:', `/calificaciones/${id}`);
      console.log('Cuerpo de la petición:', JSON.stringify(requestBody, null, 2));
      console.log('🔍 Campo unidad en requestBody:', requestBody.unidad);

      try {
        // Hacer la petición PUT al endpoint correcto
        const response = await api.put<CalificacionResponse>(`/calificaciones/${id}`, requestBody);
        
        console.log('Respuesta del servidor:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        
        if (!response.data) {
          console.error('No se recibieron datos en la respuesta');
          throw new Error('No se recibieron datos de la respuesta');
        }
        
        console.log('Calificación actualizada correctamente:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('Error en la petición PUT:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          request: error.request
        });
        throw error;
      }
    } catch (error) {
      console.error('Error al actualizar calificación:', error);
      throw error;
    }
  },

  // Eliminar una calificación
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/calificaciones/${id}`);
    } catch (error) {
      console.error('Error al eliminar calificación:', error);
      throw error;
    }
  },

  // Obtener calificaciones por período
  async getByPeriodo(periodoId: string): Promise<CalificacionResponse[]> {
    try {
      const response = await api.get<CalificacionResponse[]>(`/calificaciones/periodo/${periodoId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener calificaciones por período:', error);
      throw error;
    }
  },

  // Obtener calificaciones por materia y período
  async getByMateriaAndPeriodo(materiaId: string, tipoEvaluacionId: string, periodoId: string): Promise<CalificacionResponse[]> {
    try {
      // Use the new endpoint with the required parameters
      const response = await this.getByMateriaGradoPeriodo(
        materiaId,
        '', // grado will be handled by the backend
        periodoId,
        'Básico' // default nivel
      );

      // Transform the response to match the expected format
      return response.flatMap(item => 
        item.calificaciones
          .filter(cal => cal.tipoEvaluacion === tipoEvaluacionId)
          .map(cal => ({
            id: cal.id,
            estudianteId: item.estudiante.id,
            materiaId: cal.materia.id,
            periodoId: cal.periodo.id,
            docenteId: cal.docente.id,
            tipoCalificacion: cal.tipoCalificacion,
            tipoEvaluacion: cal.tipoEvaluacion,
            calificacion: cal.calificacion,
            valorConceptual: cal.valorConceptual,
            comentario: cal.comentario,
            fecha: cal.fecha,
            estudiante: {
              id: item.estudiante.id,
              nombre: item.estudiante.nombre,
              apellido: item.estudiante.apellido,
              grados: [item.estudiante.grado]
            },
            materia: cal.materia,
            periodo: cal.periodo,
            docente: cal.docente
          }))
      );
    } catch (error) {
      console.error('Error al obtener calificaciones por materia y período:', error);
      throw error;
    }
  },

  // Crear calificación extracurricular
  async createExtracurricularGrade(data: CreateExtracurricularRequest): Promise<CalificacionResponse> {
    try {
      console.log('Creando calificación extracurricular con datos:', data);
      
      const requestData = {
        estudianteId: data.estudianteId,
        userMateriaId: data.materiaId,
        periodoId: data.periodoId,
        tipoCalificacion: 'CONCEPTUAL' as const,
        tipoEvaluacion: 'EXTRAESCOLAR',
        valorConceptual: data.valorConceptual,
        comentario: data.comentario || 'Evaluación de actividad extraescolar',
        esExtraescolar: true,
        nombreMateria: data.nombreMateria
      };

      console.log('Datos de la petición para calificación extracurricular:', JSON.stringify(requestData, null, 2));
      
      const response = await api.post<CalificacionResponse>('/calificaciones', requestData);
      
      if (!response.data) {
        throw new Error('No se recibieron datos de la respuesta');
      }

      console.log('Calificación extracurricular creada exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear calificación extracurricular:', error);
      throw error;
    }
  },
  
  // Obtener calificaciones por estudiante y materia
  async getByEstudianteAndMateria(estudianteId: string, materiaId: string): Promise<CalificacionResponse[]> {
    try {
      const response = await api.get<CalificacionResponse[]>(`/calificaciones/estudiante/${estudianteId}/materia/${materiaId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener calificaciones por estudiante y materia:', error);
      throw error;
    }
  },

  // Obtener calificaciones por materia, grado y período
  async getByMateriaGradoPeriodo(
    materiaId: string,
    grado: string,  // Grado completo (ej: "1° Básico")
    periodoId: string,
    nivel?: string,
    seccion?: string
  ): Promise<CalificacionPorGradoResponse[]> {
    try {
      // Preparar los parámetros de la consulta
      const params: Record<string, string> = {
        materiaId,
        grado,
        periodoId
      };
      
      // Agregar parámetros opcionales si están definidos
      if (nivel) params.nivel = nivel;
      if (seccion) params.seccion = seccion;
      
      // Hacer la petición
      const response = await api.get<CalificacionPorGradoResponse[]>(
        '/calificaciones/profesor/materia-grado',
        { 
          params,
          // Asegurar que los parámetros se envíen correctamente
          paramsSerializer: (params) => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
              }
            });
            return searchParams.toString();
          }
        }
      );

      return response.data || [];
    } catch (error: any) {
      console.error('Error al obtener calificaciones por materia, grado y período:', error);
      
      // Manejar error de autenticación
      if (error.response?.status === 401) {
        console.error('Error de autenticación. Token inválido o expirado.');
        
        // Limpiar el token si está vencido
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirigir a la página de login
          window.location.href = '/login?session_expired=true';
        }
      }
      
      throw error;
    }
  },

  // Actualizar calificación extracurricular
  async updateExtracurricularGrade(
    id: string,
    data: {
      valorConceptual: ValorConceptual;
      comentario?: string;
      nombreMateria?: string;
    }
  ): Promise<CalificacionResponse> {
    try {
      const updateData = {
        valorConceptual: data.valorConceptual,
        comentario: data.comentario || undefined,
        esExtraescolar: true,
        ...(data.nombreMateria ? { nombreMateria: data.nombreMateria } : {})
      };

      const response = await api.put<CalificacionResponse>(
        `/calificaciones/${id}`,
        updateData
      );

      if (!response.data) {
        throw new Error('No se recibieron datos de la respuesta');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error al actualizar calificación extracurricular:', error);
      
      // Manejar error de autenticación
      if (error.response?.status === 401) {
        console.error('Error de autenticación. Token inválido o expirado.');
        
        // Limpiar el token si está vencido
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirigir a la página de login
          window.location.href = '/login?session_expired=true';
        }
      }
      
      throw error;
    }
  },
  
  // Guardar evaluaciones de hábitos
  async saveHabitGrades(estudianteId: string, data: SaveHabitGradesRequest): Promise<void> {
    try {
      console.log('🔍 saveHabitGrades - Iniciando guardado:', {
        estudianteId,
        periodoId: data.periodoId,
        totalCalificaciones: data.calificaciones.length
      });
      
      console.log('🔍 saveHabitGrades - Datos a enviar:', JSON.stringify({
        periodoId: data.periodoId,
        calificaciones: data.calificaciones
      }, null, 2));
      
      const url = `/calificaciones-habitos/estudiante/${estudianteId}`;
      console.log('🔍 saveHabitGrades - URL:', url);
      
      const requestData = {
        periodoId: data.periodoId,
        calificaciones: data.calificaciones.map(habito => ({
          evaluacionHabitoId: habito.evaluacionHabitoId,
          u1: habito.u1 || null,
          u2: habito.u2 || null,
          u3: habito.u3 || null,
          u4: habito.u4 || null,
          comentario: habito.comentario || ''
        }))
      };
      
      console.log('🔍 saveHabitGrades - Request final:', JSON.stringify(requestData, null, 2));
      
      const response = await api.put(url, requestData);
      
      console.log('🔍 saveHabitGrades - Respuesta exitosa:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      return response.data;
    } catch (error: any) {
      console.error('🔍 saveHabitGrades - Error detallado:', {
        error,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        estudianteId,
        periodoId: data.periodoId
      });
      
      // Si es un error 404, podría ser que el endpoint no existe o el estudiante no tiene evaluaciones configuradas
      if (error.response?.status === 404) {
        console.warn('🔍 saveHabitGrades - Error 404: Posible problema con el endpoint o configuración');
      }
      
      // Si es un error 400, podría ser un problema con los datos enviados
      if (error.response?.status === 400) {
        console.warn('🔍 saveHabitGrades - Error 400: Posible problema con los datos enviados');
      }
      
      // Si es un error 401/403, problema de autenticación
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('🔍 saveHabitGrades - Error de autenticación:', error.response?.status);
      }
      
      throw error;
    }
  },

  // Obtener evaluaciones de hábitos de un estudiante
  async getHabitGrades(estudianteId: string, periodoId: string): Promise<any[]> {
    try {
      console.log('🔍 getHabitGrades - Iniciando llamada:', {
        estudianteId,
        periodoId,
        url: `/calificaciones-habitos/estudiante/${estudianteId}?periodoId=${periodoId}`
      });
      
      const response = await api.get(`/calificaciones-habitos/estudiante/${estudianteId}?periodoId=${periodoId}`);
      
      console.log('🔍 getHabitGrades - Respuesta de API:', {
        status: response.status,
        data: response.data,
        dataType: typeof response.data
      });
      
      // Log adicional para ver la estructura cruda
      console.log('🔍 getHabitGrades - Datos crudos recibidos:', JSON.stringify(response.data, null, 2));
      
      // Contar los tipos de datos recibidos
      if (Array.isArray(response.data)) {
        const tiposRecibidos = [...new Set(response.data.map((item: any) => item.tipo))];
        console.log('🔍 getHabitGrades - Tipos recibidos:', tiposRecibidos);
        console.log('🔍 getHabitGrades - EXTRACURRICULAR items recibidos:', response.data.filter((item: any) => item.tipo === 'EXTRACURRICULAR'));
      }
      
      if (!response.data) {
        console.log('🔍 getHabitGrades - No hay datos en respuesta, retornando array vacío');
        return [];
      }

      // Si los datos vienen en un objeto con propiedad 'calificaciones'
      let habitData = Array.isArray(response.data) ? response.data : response.data.calificaciones || [];
      
      console.log('🔍 getHabitGrades - habitData inicial:', habitData.length, 'registros');
      
      // 🔥 IMPORTANTE: Verificar si faltan EXTRACURRICULAR y buscarlas en calificaciones regulares
      const extracurricularInHabitData = habitData.filter((h: any) => h.tipo === 'EXTRACURRICULAR');
      console.log('🔍 getHabitGrades - EXTRACURRICULAR en habitData:', extracurricularInHabitData.length);
      
      if (extracurricularInHabitData.length === 0) {
        console.log('🔍 getHabitGrades - No se encontraron EXTRACURRICULAR en habitData, buscando en calificaciones regulares...');
        
        try {
          // Buscar calificaciones extracurriculares en el endpoint regular
          const regularGrades = await this.getByStudent(estudianteId, periodoId);
          console.log('🔍 getHabitGrades - Calificaciones regulares obtenidas:', regularGrades.length);
          
          // Debug: mostrar todas las calificaciones para ver qué hay
          console.log('🔍 getHabitGrades - Todas las calificaciones:', regularGrades.map(g => ({
            nombre: g.materia?.nombre,
            esExtraescolar: g.esExtraescolar,
            unidad: g.unidad,
            calificacion: g.calificacion
          })));
          
          // Filtrar solo las que son extracurriculares
          const extracurricularFromRegular = regularGrades.filter((grade: any) => {
            const isExtra = grade.esExtraescolar === true || 
                           esNombreExtracurricular(grade.materia?.nombre || '') ||
                           grade.tipoMateriaId === '84324295-386d-4d43-9fdd-043ac7689b22'; // ID de tipo EXTRACURRICULAR
            console.log('🔍 Evaluando calificación:', {
              nombre: grade.materia?.nombre,
              esExtraescolar: grade.esExtraescolar,
              tipoMateriaId: grade.tipoMateriaId,
              esNombreExtracurricular: esNombreExtracurricular(grade.materia?.nombre || ''),
              resultado: isExtra
            });
            return isExtra;
          });
          
          console.log('🔍 getHabitGrades - EXTRACURRICULAR encontradas en calificaciones regulares:', extracurricularFromRegular.length);
          
          // Convertir las calificaciones extracurriculares al formato de hábitos
          const extracurricularAsHabits = extracurricularFromRegular.map((grade: any) => ({
            evaluacionHabitoId: grade.id,
            materiaId: grade.materiaId,
            nombre: grade.materia?.nombre || 'Extracurricular sin nombre',
            descripcion: `Evaluación de ${grade.materia?.nombre}`,
            tipo: 'EXTRACURRICULAR',
            u1: grade.unidad === 'u1' ? (grade.calificacion || null) : null,
            u2: grade.unidad === 'u2' ? (grade.calificacion || null) : null,
            u3: grade.unidad === 'u3' ? (grade.calificacion || null) : null,
            u4: grade.unidad === 'u4' ? (grade.calificacion || null) : null,
            comentario: grade.comentario || null,
            createdAt: null, // No disponible en CalificacionPorEstudiante
            updatedAt: null, // No disponible en CalificacionPorEstudiante
            calificaciones: [], // Mantener compatibilidad
            esMateria: false,
            // Agregar campos adicionales para compatibilidad
            esExtracurricular: true,
            fuente: 'getByStudent'
          }));
          
          console.log('🔍 getHabitGrades - EXTRACURRICULAR convertidas a formato hábitos:', extracurricularAsHabits);
          
          // Agregar las extracurriculares encontradas a habitData
          habitData = [...habitData, ...extracurricularAsHabits];
          console.log('🔍 getHabitGrades - habitData después de agregar calificaciones regulares:', habitData.length);
          
          // 🔥 NUEVO FALLBACK: Si todavía no hay EXTRACURRICULAR, buscar directamente en materias (como el dashboard)
          if (extracurricularFromRegular.length === 0) {
            console.log('🔍 getHabitGrades - Todavía no hay EXTRACURRICULAR, buscando en materias (como dashboard)...');
            
            try {
              // Obtener todas las materias disponibles (mismo enfoque que dashboard)
              const materiasResponse = await api.get('/materias/docente/mis-materias');
              const todasLasMaterias = materiasResponse.data || [];
              
              console.log('🔍 getHabitGrades - Total materias disponibles:', todasLasMaterias.length);
              
              // IDs directos de la base de datos (mismo enfoque que dashboard)
              const HOGAR_ID = "e133dce1-bb77-4b05-bdcb-0dc5d4c5df19";
              const HABITO_ID = "16b47d65-2cb9-4c2e-8779-9e2f5576d896";
              const EXTRACURRICULAR_ID = "d4965c36-c72a-43bb-8645-0e671df356c2";
              
              // Filtrar solo las materias extracurriculares (mismo filtro que dashboard)
              const materiasExtracurriculares = todasLasMaterias.filter((materia: any) => {
                const esExtracurricularPorTipo = materia.tipoMateriaId === EXTRACURRICULAR_ID;
                const esExtracurricularPorFlag = materia.esExtracurricular === true;
                const esExtracurricularPorNombre = esNombreExtracurricular(materia.nombre || '');
                
                const esExtra = esExtracurricularPorTipo || esExtracurricularPorFlag || esExtracurricularPorNombre;
                
                console.log('🔍 Evaluando materia:', {
                  id: materia.id,
                  nombre: materia.nombre,
                  tipoMateriaId: materia.tipoMateriaId,
                  esExtraescolar: materia.esExtraescolar,
                  esExtracurricularPorTipo,
                  esExtracurricularPorFlag,
                  esExtracurricularPorNombre,
                  resultado: esExtra
                });
                return esExtra;
              });
              
              console.log('🔍 getHabitGrades - Materias extracurriculares encontradas:', materiasExtracurriculares.length);
              
              // Convertir las materias extracurriculares al formato de hábitos
              const extracurricularFromMaterias = materiasExtracurriculares.map((materia: any) => ({
                evaluacionHabitoId: materia.id,
                materiaId: materia.materiaId || materia.id,
                nombre: materia.nombre,
                descripcion: materia.descripcion || `Evaluación de ${materia.nombre}`,
                tipo: 'EXTRACURRICULAR', // Forzar el tipo a EXTRACURRICULAR
                u1: null, // Sin calificación inicial
                u2: null,
                u3: null,
                u4: null,
                comentario: null,
                createdAt: materia.createdAt,
                updatedAt: materia.updatedAt,
                calificaciones: [], // Mantener compatibilidad
                esMateria: true,
                esExtracurricular: true,
                fuente: 'materias-docente'
              }));
              
              console.log('🔍 getHabitGrades - EXTRACURRICULAR desde materias:', extracurricularFromMaterias);
              
              // Agregar las extracurriculares encontradas a habitData
              habitData = [...habitData, ...extracurricularFromMaterias];
              console.log('🔍 getHabitGrades - habitData final con EXTRACURRICULAR de materias:', habitData.length);
              
            } catch (error) {
              console.warn('🔍 getHabitGrades - Error al buscar EXTRACURRICULAR en materias:', error);
            }
          }
          
        } catch (error) {
          console.warn('🔍 getHabitGrades - Error al buscar EXTRACURRICULAR en calificaciones regulares:', error);
        }
      }
      
      // Obtener las tablas necesarias para enriquecer los datos
      
      // Obtener lista completa de materias
      const materiasResponse = await api.get('/materias');
      const todasLasMaterias = materiasResponse.data || [];
      
      // Obtener tabla de tipos de materia
      const tiposMateriaResponse = await api.get('/materias/tipos');
      const tiposMateria = tiposMateriaResponse.data || [];
      
      // Crear mapas para acceso rápido
      const materiasMap = new Map();
      const tiposMateriaMap = new Map();
      
      todasLasMaterias.forEach((materia: any) => {
        materiasMap.set(materia.id, materia);
      });
      
      tiposMateria.forEach((tipo: any) => {
        tiposMateriaMap.set(tipo.id, tipo);
      });
      
      // Enriquecer los datos de hábitos con información completa
      habitData = habitData.map((habito: any) => {
        console.log('🔍 Procesando hábito:', {
          evaluacionHabitoId: habito.evaluacionHabitoId,
          nombre: habito.nombre,
          tipo: habito.tipo,
          materiaId: habito.materiaId
        });
        
        const materiaInfo = habito.materiaId ? materiasMap.get(habito.materiaId) : null;
        const tipoMateriaId = materiaInfo?.tipoMateriaId || habito.tipoMateriaId || null;
        const tipoMateriaInfo = tipoMateriaId ? tiposMateriaMap.get(tipoMateriaId) : null;
        
        console.log('🔍 Info encontrada:', {
          materiaInfo,
          tipoMateriaId,
          tipoMateriaInfo
        });
        
        if (!materiaInfo) {
          console.log('🔍 No se encontró información de materia para el hábito:', habito.nombre);
        }
        
        // Determinar si es extracurricular basado en múltiples fuentes
        const esExtracurricular = tipoMateriaInfo?.nombre === 'EXTRACURRICULAR' || 
                                     materiaInfo?.esExtracurricular === true || 
                                     habito.esExtracurricular === true ||
                                     habito.tipo === 'EXTRACURRICULAR' ||
                                     // Detectar por nombre de materia extracurricular conocida
                                     esNombreExtracurricular(habito.nombre);
        
        console.log('🔍 ¿Es extracurricular?', {
          nombre: habito.nombre,
          tipo: habito.tipo,
          esExtracurricular,
          tipoMateriaNombre: tipoMateriaInfo?.nombre,
          materiaEsExtracurricular: materiaInfo?.esExtracurricular
        });
        
        // Determinar si es HOGAR basado en múltiples fuentes
        const esHogar = tipoMateriaInfo?.nombre === 'HOGAR' || 
                        habito.tipoMateriaNombre === 'HOGAR' ||
                        habito.tipo === 'HOGAR' ||
                        (materiaInfo?.tipoMateriaId && 
                         tiposMateriaMap.get(materiaInfo.tipoMateriaId)?.nombre === 'HOGAR');
        
        // Determinar si es HABITO/COMPORTAMIENTO/APRENDIZAJE/CASA basado en múltiples fuentes
        const esHabito = (
          // Check tipoMateriaInfo first
          tipoMateriaInfo?.nombre === 'HABITO' || 
          tipoMateriaInfo?.nombre === 'COMPORTAMIENTO' ||
          tipoMateriaInfo?.nombre === 'APRENDIZAJE' ||
          tipoMateriaInfo?.nombre === 'CASA' ||
          // Check habito.tipoMateriaNombre
          habito.tipoMateriaNombre === 'HABITO' ||
          habito.tipoMateriaNombre === 'COMPORTAMIENTO' ||
          habito.tipoMateriaNombre === 'APRENDIZAJE' ||
          habito.tipoMateriaNombre === 'CASA' ||
          // Check habito.tipo (direct from backend)
          habito.tipo === 'HABITO' ||
          habito.tipo === 'COMPORTAMIENTO' ||
          habito.tipo === 'APRENDIZAJE' ||
          habito.tipo === 'CASA' ||
          // Check materiaInfo and tiposMateriaMap
          (tipoMateriaId && (
            tiposMateriaMap.get(tipoMateriaId)?.nombre === 'HABITO' ||
            tiposMateriaMap.get(tipoMateriaId)?.nombre === 'COMPORTAMIENTO' ||
            tiposMateriaMap.get(tipoMateriaId)?.nombre === 'APRENDIZAJE' ||
            tiposMateriaMap.get(tipoMateriaId)?.nombre === 'CASA'
          ))
        );
        
        return {
          ...habito,
          // Agregar información completa de la materia
          materia: materiaInfo || {
            id: habito.materiaId || habito.evaluacionHabitoId,
            nombre: habito.nombre || 'Sin nombre',
            descripcion: materiaInfo?.descripcion || '',
            codigo: materiaInfo?.codigo || '',
            creditos: materiaInfo?.creditos || 0,
            activa: materiaInfo?.activa !== false,
            createdAt: materiaInfo?.createdAt || '',
            updatedAt: materiaInfo?.updatedAt || '',
            tipoMateriaId: materiaInfo?.tipoMateriaId || null,
            esExtracurricular: esExtracurricular,
            orden: materiaInfo?.orden || 0
          },
          // Mantener las referencias directas para compatibilidad
          esExtracurricular: esExtracurricular,
          tipoMateriaId: materiaInfo?.tipoMateriaId || tipoMateriaInfo?.id || null,
          tipoMateriaNombre: tipoMateriaInfo?.nombre || materiaInfo?.tipoMateria || habito.tipo || 'SIN TIPO',
          codigo: materiaInfo?.codigo || habito.codigo || '',
          // Mantener los datos originales del backend como fallback
          idOriginal: habito.id,
          codigoOriginal: habito.codigo,
          esExtracurricularOriginal: habito.esExtracurricular,
          // Nuevos campos para mejor clasificación
          esHogar,
          esHabito,
          // Importante: mantener el tipo original del backend
          tipoOriginal: habito.tipo
        };
      });
      
      // 🔥 NUEVO: Auto-asignar extracurriculares según el grado del estudiante
      try {
        console.log('🔍 getHabitGrades - Verificando si se necesitan auto-asignar extracurriculares...');
        
        // Obtener grado del estudiante desde los hábitos ya cargados (evitar llamada API adicional)
        let gradoEstudiante = '';
        
        // Buscar el grado en las materias de hábitos que tienen grados definidos
        const habitConGrados = habitData.find((h: any) => h.grados && h.grados.length > 0);
        if (habitConGrados && habitConGrados.grados) {
          // Usar el primer grado disponible como referencia
          gradoEstudiante = habitConGrados.grados[0];
          console.log('🔍 getHabitGrades - Grado encontrado desde hábitos:', gradoEstudiante);
        }
        
        // Si no se encuentra en los hábitos, intentar deducirlo de las calificaciones regulares
        if (!gradoEstudiante) {
          console.log('🔍 getHabitGrades - No se encontró grado en hábitos, usando valor por defecto para pruebas');
          // Para pruebas, podemos usar un grado por defecto o pasarlo como parámetro
          gradoEstudiante = '4° Perito Contador'; // Valor por defecto para pruebas
        }
        
        console.log('🔍 getHabitGrades - Grado del estudiante:', gradoEstudiante);
        
        // Definir extracurriculares por grado (mismo que academicData.ts)
        const extracurricularesPorGrado = {
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
          '4° Bachillerato': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
          '5° Bachillerato': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
          '6° Bachillerato': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
          '4° Bachillerato en Ciencias y Letras': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
          '5° Bachillerato en Ciencias y Letras': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal'],
          '6° Bachillerato en Ciencias y Letras': ['Moral Cristiana', 'Programa de Lectura', 'Razonamiento Verbal']
        };
        
        // Verificar si el grado tiene extracurriculares definidas
        const extracurricularesEsperadas = extracurricularesPorGrado[gradoEstudiante as keyof typeof extracurricularesPorGrado];
        
        if (extracurricularesEsperadas && extracurricularesEsperadas.length > 0) {
          console.log('🔍 getHabitGrades - Extracurriculares esperadas para', gradoEstudiante, ':', extracurricularesEsperadas);
          
          // Obtener extracurriculares actuales del estudiante
          const extracurricularesActuales = habitData.filter((h: any) => h.tipo === 'EXTRACURRICULAR');
          const nombresActuales = extracurricularesActuales.map((h: any) => h.nombre);
          
          console.log('🔍 getHabitGrades - Extracurriculares actuales:', nombresActuales);
          
          // Verificar si faltan extracurriculares
          const faltantes = extracurricularesEsperadas.filter(nombre => !nombresActuales.includes(nombre));
          
          if (faltantes.length > 0) {
            console.log('🔍 getHabitGrades - Faltan extracurriculares por asignar:', faltantes);
            
            // Obtener información de las materias faltantes
            for (const nombreFaltante of faltantes) {
              const materiaInfo = todasLasMaterias.find((m: any) => m.nombre === nombreFaltante && m.esExtracurricular);
              
              if (materiaInfo) {
                console.log('🔍 getHabitGrades - Agregando extracurricular faltante:', nombreFaltante);
                
                // Crear hábito extracurricular
                const nuevoHabit = {
                  evaluacionHabitoId: `auto-${materiaInfo.id}-${Date.now()}`,
                  materiaId: materiaInfo.id,
                  nombre: materiaInfo.nombre,
                  descripcion: `Evaluación de ${materiaInfo.nombre}`,
                  tipo: 'EXTRACURRICULAR',
                  u1: null,
                  u2: null,
                  u3: null,
                  u4: null,
                  comentario: null,
                  createdAt: null,
                  updatedAt: null,
                  calificaciones: [],
                  esMateria: false,
                  esExtracurricular: true,
                  fuente: 'auto-asignado',
                  grados: materiaInfo.grados || []
                };
                
                habitData.push(nuevoHabit);
              } else {
                console.warn('🔍 getHabitGrades - No se encontró información para extracurricular:', nombreFaltante);
              }
            }
            
            console.log('🔍 getHabitGrades - Total hábitos después de auto-asignación:', habitData.length);
          } else {
            console.log('🔍 getHabitGrades - Todas las extracurriculares ya están asignadas correctamente');
          }
        } else {
          console.log('🔍 getHabitGrades - No hay extracurriculares definidas para el grado:', gradoEstudiante);
        }
      } catch (error) {
        console.warn('🔍 getHabitGrades - Error en auto-asignación de extracurriculares:', error);
      }
      
      return habitData;
    } catch (error: any) {
      console.error('🔍 getHabitGrades - Error detallado:', {
        error,
        errorMessage: error.message,
        errorStatus: error.response?.status,
        errorData: error.response?.data,
        estudianteId,
        periodoId
      });
      
      // Si es un error 404, probablemente no hay evaluaciones de hábitos
      if (error.response?.status === 404) {
        console.log('🔍 getHabitGrades - No se encontraron evaluaciones (404), retornando array vacío');
        return [];
      }
      
      // Para otros errores, también retornar array vacío para no romper la aplicación
      console.log('🔍 getHabitGrades - Error general, retornando array vacío como fallback');
      return [];
    }
  },
};

export default gradeService;
