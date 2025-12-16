// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Validación básica
    const { firstName, lastName, email, password } = userData;
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Registrar usuario usando la API
    const response = await api.post('/auth/register', {
      ...userData,
      role: userData.role || 'docente',
      status: 'active'
    });
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al registrar el usuario';
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: typeof response.error === 'object' ? response.error : undefined
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      user: response.data?.user
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { 
        error: "Error al registrar el usuario",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
