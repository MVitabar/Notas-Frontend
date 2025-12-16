// lib/models/User.ts
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper functions that would interact with the API
export const userService = {
  async getUser(id: string): Promise<User | null> {
    // This would be implemented in your API service
    throw new Error('Not implemented - use api.get("/users/${id}")');
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    // This would be implemented in your API service
    throw new Error('Not implemented - use api.put("/users/${id}", userData)');
  }
};