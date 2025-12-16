// app/api/teachers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

// POST: Crear docente (admin)
export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone, address } = await request.json();

    // Validación básica
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" }, 
        { status: 400 }
      );
    }

    // Crear el docente usando la API
    const response = await api.post('/teachers', {
      email,
      password,
      firstName,
      lastName,
      phone: phone || null,
      address: address || null,
      role: 'teacher',
      status: 'active'
    });

    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al crear el docente';
      
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
    console.error("Error creating teacher:", error);
    return NextResponse.json(
      { error: "Error al crear el docente" },
      { status: 500 }
    );
  }
}

// GET: Listar docentes (admin)
export async function GET() {
  console.log("[GET] /api/teachers - Listar docentes");
  try {
    const response = await api.get('/teachers');
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    const teachers = response.data?.data || [];
    console.log("[GET] /api/teachers - Total docentes:", teachers.length);
    
    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json(
      { error: "Error al obtener los docentes" },
      { status: 500 }
    );
  }
}
