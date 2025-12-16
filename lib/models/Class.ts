// lib/models/Class.ts
export interface Class {
  id: string;
  teacherId: string; // Reference to User with role 'teacher'
  grade: string;
  subject: string;
  academicYear: string;
  semester: string;
  schedule: string;
  classroom: string;
  maxStudents: number;
  description: string;
  studentIds: string[]; // Array of student IDs
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// Helper functions that would interact with the API
export const classService = {
  async createClass(classData: Omit<Class, 'id'>): Promise<Class> {
    // This would be implemented in your API service
    throw new Error('Not implemented - use api.post("/classes", classData)');
  },

  async getClass(id: string): Promise<Class | null> {
    // This would be implemented in your API service
    throw new Error('Not implemented - use api.get("/classes/${id}")');
  }
};