// app/api/students/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';

interface StudentData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await api.get(`/students/${params.id}`);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al obtener el estudiante';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: typeof response.error === 'object' ? response.error : undefined
        },
        { status: response.status || 404 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener el estudiante',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updateData: Partial<StudentData> = await request.json();
    
    // No permitir actualización de campos sensibles
    const { studentCode, ...safeUpdateData } = updateData;
    
    // Remove id if it exists in the update data
    if ('id' in safeUpdateData) {
      delete (safeUpdateData as any).id;
    }

    const response = await api.put(`/students/${params.id}`, safeUpdateData);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al actualizar el estudiante';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: typeof response.error === 'object' ? response.error : undefined
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { 
        error: 'Error al actualizar el estudiante',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await api.delete(`/students/${params.id}`);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al eliminar el estudiante';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: typeof response.error === 'object' ? response.error : undefined
        },
        { status: response.status || 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar el estudiante',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
