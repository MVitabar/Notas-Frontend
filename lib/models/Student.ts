// lib/models/Student.ts
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  studentCode?: string;
  grade: string;
  parentName: string;
  parentPhone?: string;
  parentEmail?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  medicalInfo?: string;
  status?: 'active' | 'inactive' | 'suspended';
  userId?: string; // Reference to User if they have a user account
  createdAt?: string;
  updatedAt?: string;
}

// Helper functions that would interact with the API
export const studentService = {
  async createStudent(studentData: Omit<Student, 'id'>): Promise<Student> {
    // This would be implemented in your API service
    throw new Error('Not implemented - use api.post("/students", studentData)');
  },

  async getStudent(id: string): Promise<Student | null> {
    // This would be implemented in your API service
    throw new Error('Not implemented - use api.get("/students/${id}")');
  }
};