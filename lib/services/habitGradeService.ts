import { api } from '../api';

export interface HabitGrade {
  id: string;
  estudianteId: string;
  evaluacionHabitoId: string;
  periodoId: string;
  docenteId: string;
  u1: string | null;
  u2: string | null;
  u3: string | null;
  u4: string | null;
  comentario: string | null;
  esExtraescolar: boolean;
  createdAt: string;
  updatedAt: string;
  evaluacionHabito: {
    id: string;
    nombre: string;
    descripcion: string;
    tipo: 'habito_casa' | 'responsabilidad_aprendizaje' | 'comportamiento';
    orden: number;
    activo: boolean;
    esExtraescolar: boolean;
  };
  docente: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface HabitGradeSummary {
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
}

export interface CreateUpdateHabitGradeDto {
  estudianteId: string;
  evaluacionHabitoId: string;
  periodoId: string;
  docenteId: string;
  u1?: string | null;
  u2?: string | null;
  u3?: string | null;
  u4?: string | null;
  comentario?: string;
  esExtraescolar?: boolean;
}

export interface UpdateHabitGradeDto {
  u1?: string | null;
  u2?: string | null;
  u3?: string | null;
  u4?: string | null;
  comentario?: string;
}

export const habitGradeService = {
  // Obtener calificaciones por estudiante
  async getByStudent(estudianteId: string, periodoId: string): Promise<HabitGrade[]> {
    try {
      const response = await api.get(`/calificaciones-habitos/estudiante/${estudianteId}`, {
        params: { periodoId }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener calificaciones de hábitos:', error);
      throw error;
    }
  },

  // Obtener resumen de hábitos por estudiante
  async getSummary(estudianteId: string, periodoId: string): Promise<HabitGradeSummary> {
    try {
      // Intenta con el endpoint que incluye el estudianteId en la ruta
      const response = await api.get(`/calificaciones-habitos/estudiante/${estudianteId}`, {
        params: { periodoId }
      });
      
      // Mapear la respuesta al formato esperado si es necesario
      if (response.data) {
        return {
          habito_casa: response.data.habito_casa || [],
          responsabilidad_aprendizaje: response.data.responsabilidad_aprendizaje || [],
          comportamiento: response.data.comportamiento || []
        };
      }
      
      return {
        habito_casa: [],
        responsabilidad_aprendizaje: [],
        comportamiento: []
      };
    } catch (error) {
      console.error('Error al obtener resumen de hábitos:', error);
      // Retornar un objeto vacío en caso de error
      return {
        habito_casa: [],
        responsabilidad_aprendizaje: [],
        comportamiento: []
      };
    }
  },

  // Obtener resumen de hábitos (nuevo formato con parámetros de consulta)
  async getSummaryByQuery(estudianteId: string, periodoId: string): Promise<HabitGradeSummary> {
    try {
      const response = await api.get('/calificaciones-habitos/resumen', {
        params: { estudianteId, periodoId }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen de hábitos (nuevo formato):', error);
      throw error;
    }
  },

  // Crear calificación de hábito
  async create(gradeData: CreateUpdateHabitGradeDto): Promise<HabitGrade> {
    try {
      const dataToSend = {
        ...gradeData,
        esExtraescolar: true, // Forzar a true para hábitos
        u1: gradeData.u1 || null,
        u2: gradeData.u2 || null,
        u3: gradeData.u3 || null,
        u4: gradeData.u4 || null,
        comentario: gradeData.comentario || null
      };
      
      console.log('Enviando datos de hábito:', dataToSend);
      const response = await api.post('/calificaciones-habitos', dataToSend);
      return response.data;
    } catch (error) {
      console.error('Error al crear calificación de hábito:', error);
      throw error;
    }
  },

  // Crear o actualizar calificación de hábito (método de conveniencia)
  async createOrUpdate(gradeData: CreateUpdateHabitGradeDto): Promise<HabitGrade> {
    try {
      // Primero intentamos obtener las calificaciones existentes
      const existingGrades = await this.getByStudent(gradeData.estudianteId, gradeData.periodoId);
      const existingGrade = existingGrades.find(
        grade => grade.evaluacionHabitoId === gradeData.evaluacionHabitoId
      );

      if (existingGrade) {
        // Si existe, actualizamos
        return this.update(existingGrade.id, {
          u1: gradeData.u1,
          u2: gradeData.u2,
          u3: gradeData.u3,
          u4: gradeData.u4,
          comentario: gradeData.comentario
        });
      } else {
        // Si no existe, creamos una nueva
        return this.create(gradeData);
      }
    } catch (error) {
      console.error('Error al guardar calificación de hábito:', error);
      throw error;
    }
  },

  // Actualizar calificación específica
  async update(gradeId: string, updateData: UpdateHabitGradeDto): Promise<HabitGrade> {
    try {
      const dataToUpdate = {
        ...updateData,
        esExtraescolar: true // Mantener como true al actualizar
      };
      
      console.log('Actualizando calificación con datos:', dataToUpdate);
      const response = await api.patch(`/calificaciones-habitos/${gradeId}`, dataToUpdate);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar calificación de hábito:', error);
      throw error;
    }
  }
};
