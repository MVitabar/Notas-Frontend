import { api } from "@/lib/api";

export interface UserMateria {
  id: string;
  docenteId: string;
  materiaId: string;
  seccion: string;
  horario: string;
  periodo: string;
  estado: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;  // ISO-8601 format
  endDate: string;    // ISO-8601 format
  isCurrent: boolean;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  description?: string;
  createdAt: string;
  updatedAt: string;
  userMaterias?: UserMateria[];
}

export const academicPeriodService = {
  /**
   * Obtiene todos los períodos académicos
   */
  async getAllPeriods(): Promise<AcademicPeriod[]> {
    try {
      const response = await api.get<AcademicPeriod[]>('/academic-periods');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener los períodos académicos:', error);
      throw error;
    }
  },

  /**
   * Obtiene el período académico actual
   */
  async getCurrentPeriod(): Promise<AcademicPeriod | null> {
    try {
      const response = await api.get<AcademicPeriod>('/academic-periods/current');
      return response.data || null;
    } catch (error) {
      console.error('Error al obtener el período actual:', error);
      return null;
    }
  },

  /**
   * Obtiene un período académico por su ID
   */
  async getPeriodById(id: string): Promise<AcademicPeriod | null> {
    try {
      const response = await api.get<{ data: AcademicPeriod }>(`/academic-periods/${id}`);
      if (!response.data) {
        console.error('No se recibieron datos del servidor');
        return null;
      }
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener el período con ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Crea un nuevo período académico
   */
  async createPeriod(periodData: Omit<AcademicPeriod, 'id' | 'createdAt' | 'updatedAt'>): Promise<AcademicPeriod> {
    try {
      const response = await api.post<{ data: AcademicPeriod }>('/academic-periods', periodData);
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error al crear el período académico:', error);
      throw error;
    }
  },

  /**
   * Actualiza un período académico existente
   */
  async updatePeriod(id: string, periodData: Partial<AcademicPeriod>): Promise<AcademicPeriod | null> {
    try {
      const formattedData = { ...periodData };
      
      // Format dates to ISO strings if they exist
      if (formattedData.startDate) {
        formattedData.startDate = new Date(formattedData.startDate).toISOString();
      }
      if (formattedData.endDate) {
        formattedData.endDate = new Date(formattedData.endDate).toISOString();
      }
      
      const response = await api.put<AcademicPeriod>(`/academic-periods/${id}`, formattedData);
      return response.data || null;
    } catch (error) {
      console.error(`Error al actualizar el período con ID ${id}:`, error);
      throw error; // Re-throw to handle in the component
    }
  },

  /**
   * Elimina un período académico
   */
  async deletePeriod(id: string): Promise<{ success: boolean; data?: AcademicPeriod }> {
    try {
      const response = await api.delete<{ data: AcademicPeriod }>(`/academic-periods/${id}`);
      return { success: true, data: response.data?.data };
    } catch (error) {
      console.error(`Error al eliminar el período con ID ${id}:`, error);
      return { success: false };
    }
  },

  /**
   * Marca un período como activo
   */
  async activatePeriod(id: string): Promise<AcademicPeriod> {
    try {
      // First, deactivate all other current periods
      const periods = await this.getAllPeriods();
      await Promise.all(
        periods
          .filter(p => p.id !== id && p.isCurrent)
          .map(p => this.updatePeriod(p.id, { 
            ...p, 
            status: 'cancelled', 
            isCurrent: false 
          }))
      );
      
      // Then activate the selected period
      const updatedPeriod = await this.updatePeriod(id, { 
        status: 'active', 
        isCurrent: true 
      });
      
      if (!updatedPeriod) {
        throw new Error('No se pudo activar el período');
      }
      
      return updatedPeriod;
    } catch (error) {
      console.error(`Error al activar el período con ID ${id}:`, error);
      throw error;
    }
  }
};
