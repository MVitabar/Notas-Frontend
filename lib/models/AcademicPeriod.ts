// lib/models/AcademicPeriod.ts
export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  isCurrent: boolean;
  description?: string;
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

// Helper functions that would interact with the API
export const academicPeriodService = {
  async getCurrentPeriod(): Promise<AcademicPeriod | null> {
    // This would be implemented in your API service
    throw new Error('Not implemented - use api.get("/academic-periods/current")');
  },

  async listPeriods(): Promise<AcademicPeriod[]> {
    // This would be implemented in your API service
    throw new Error('Not implemented - use api.get("/academic-periods")');
  }
};