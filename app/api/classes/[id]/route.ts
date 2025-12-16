// app/api/classes/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

interface ClassData {
  id: string;
  name: string;
  teacherId: string;
  grade: string;
  subject: string;
  academicYear: string;
  schedule: string;
  classroom: string;
  maxStudents: number;
  description: string;
  studentIds: string[];
  status: 'active' | 'inactive';
}

// GET: Ver clase (admin/docente)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await api.get<ClassData>(`/classes/${params.id}`);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al obtener la clase';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 404 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { 
        error: "Error al obtener la clase",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT: Actualizar clase (admin)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updateData = await request.json();
    
    // Remove any sensitive fields that shouldn't be updated
    const { id, ...safeUpdateData } = updateData;
    
    const response = await api.put<ClassData>(`/classes/${params.id}`, safeUpdateData);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al actualizar la clase';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { 
        error: "Error al actualizar la clase",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar clase (admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await api.delete(`/classes/${params.id}`);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al eliminar la clase';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { 
        error: "Error al eliminar la clase",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
