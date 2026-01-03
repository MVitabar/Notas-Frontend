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

const gradeService: IGradeService = {
  // Obtener calificaciones de un estudiante
  async getByStudent(estudianteId: string, periodoId?: string): Promise<CalificacionPorEstudiante[]> {
    try {
      const params = new URLSearchParams();
      if (periodoId) params.append('periodoId', periodoId);

      const response = await api.get<CalificacionPorEstudiante[]>(`/calificaciones/estudiante/${estudianteId}?${params.toString()}`);
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
        comentario: calificacion.comentario || undefined
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
        ...(calificacion.valorConceptual && { valorConceptual: calificacion.valorConceptual }),
        ...(calificacion.esExtraescolar !== undefined && { esExtraescolar: calificacion.esExtraescolar }),
        ...(calificacion.nombreMateria && { nombreMateria: calificacion.nombreMateria })
      };

      console.log('Enviando petición PUT a:', `/calificaciones/${id}`);
      console.log('Cuerpo de la petición:', JSON.stringify(requestBody, null, 2));

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
      const response = await api.put(
        `/calificaciones-habitos/estudiante/${estudianteId}`,
        {
          periodoId: data.periodoId,
          calificaciones: data.calificaciones.map(habito => ({
            evaluacionHabitoId: habito.evaluacionHabitoId,
            u1: habito.u1 || null,
            u2: habito.u2 || null,
            u3: habito.u3 || null,
            u4: habito.u4 || null,
            comentario: habito.comentario || ''
          }))
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error al guardar evaluaciones de hábitos:', error);
      throw error;
    }
  },

  // Obtener evaluaciones de hábitos de un estudiante
  async getHabitGrades(estudianteId: string, periodoId: string): Promise<any[]> {
    try {
      const response = await api.get(`/calificaciones-habitos/estudiante/${estudianteId}?periodoId=${periodoId}`);
      
      if (!response.data) {
        return [];
      }

      // Si los datos vienen en un objeto con propiedad 'calificaciones'
      let habitData = Array.isArray(response.data) ? response.data : response.data.calificaciones || [];
      
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
        const materiaInfo = habito.evaluacionHabitoId ? materiasMap.get(habito.evaluacionHabitoId) : null;
        const tipoMateriaId = materiaInfo?.tipoMateriaId || habito.tipoMateriaId || null;
        const tipoMateriaInfo = tipoMateriaId ? tiposMateriaMap.get(tipoMateriaId) : null;
        
        if (!materiaInfo) {
          // Continuar sin información de materia
        }
        
        // Determinar si es extracurricular basado en múltiples fuentes
        const esExtracurricular = tipoMateriaInfo?.nombre === 'EXTRACURRICULAR' || 
                                     materiaInfo?.esExtracurricular === true || 
                                     habito.esExtracurricular === true;
        
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
            id: habito.evaluacionHabitoId,
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
          tipoMateriaNombre: tipoMateriaInfo?.nombre || materiaInfo?.tipoMateria || 'SIN TIPO',
          codigo: materiaInfo?.codigo || habito.codigo || '',
          // Mantener los datos originales del backend como fallback
          idOriginal: habito.id,
          codigoOriginal: habito.codigo,
          esExtracurricularOriginal: habito.esExtracurricular,
          // Nuevos campos para mejor clasificación
          esHogar,
          esHabito
        };
      });
      
      return habitData;
    } catch (error: any) {
      console.error('Error al obtener evaluaciones de hábitos:', error);
      return [];
    }
  },
};

export default gradeService;
