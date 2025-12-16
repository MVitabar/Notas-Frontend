// app/api/classes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

interface ClassData {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  grade: string;
  subject: string;
  academicYear: string;
  schedule: string;
  classroom: string;
  maxStudents: number;
  description: string;
  studentCount: number;
  status: 'active' | 'inactive';
}

// POST: Crear clase/materia (admin, asigna docente)
export async function POST(request: NextRequest) {
  try {
    const classData = await request.json();
    
    // Validación básica
    const { name, teacherId, grade, subject, academicYear, schedule } = classData;
    if (!name || !teacherId || !grade || !subject || !academicYear || !schedule) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Crear la clase usando la API
    const response = await api.post<ClassData>('/classes', {
      ...classData,
      status: 'active',
      studentCount: 0
    });
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al crear la clase';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: typeof response.error === 'object' ? response.error : undefined
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { 
        error: "Error al crear la clase",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET: Listar clases (admin/docente)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    const grade = searchParams.get("grade");
    const status = searchParams.get("status") || "active";

    // Construir la URL de consulta
    const queryParams = new URLSearchParams();
    if (teacherId) queryParams.append('teacherId', teacherId);
    if (grade) queryParams.append('grade', grade);
    if (status) queryParams.append('status', status);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/classes?${queryString}` : '/classes';

    const response = await api.get<{ data: ClassData[] }>(endpoint);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al obtener las clases';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(response.data?.data || []);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { 
        error: "Error al obtener las clases",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
