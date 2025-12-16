// app/api/students/route.ts

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

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

// POST: Crear estudiante (admin)
export async function POST(request: NextRequest) {
  try {
    const studentData: StudentData = await request.json();
    
    // Validación básica
    if (!studentData.firstName || !studentData.lastName || !studentData.grade || !studentData.parentName) {
      return NextResponse.json(
        { error: "Nombre, apellido, grado y nombre del padre/madre son campos obligatorios" }, 
        { status: 400 }
      );
    }

    // Generar un código de estudiante si no se proporciona
    const studentToCreate = {
      ...studentData,
      studentCode: studentData.studentCode || 
        `${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
      status: studentData.status || 'active'
    };

    // Verificar si el código de estudiante ya existe
    if (studentToCreate.studentCode) {
      const checkResponse = await api.get(`/students?studentCode=${studentToCreate.studentCode}`);
      if (checkResponse.data?.data?.length > 0) {
        return NextResponse.json(
          { error: "El código de estudiante ya está en uso" }, 
          { status: 400 }
        );
      }
    }

    // Crear el estudiante usando la API
    const response = await api.post('students', studentToCreate);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al crear el estudiante';
      
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
    console.error('Error creating student:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear el estudiante',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET: Listar estudiantes (admin/docente)
export async function GET() {
  try {
    const response = await api.get('/students');
    
    if (response.error) {
      throw new Error(typeof response.error === 'string' 
        ? response.error 
        : 'Error al obtener los estudiantes');
    }
    
    return NextResponse.json(response.data?.data || []);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener los estudiantes',
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}