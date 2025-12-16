// app/api/classes/[id]/enroll/route.ts

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: "Falta el ID del estudiante" }, 
        { status: 400 }
      );
    }

    // Enroll student using the API
    const response = await api.post(`/classes/${params.id}/enroll`, { studentId });
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al inscribir al estudiante';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: typeof response.error === 'object' ? response.error : undefined
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ 
      message: "Estudiante inscrito en la clase" 
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    return NextResponse.json(
      { 
        error: "Error al inscribir al estudiante",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
