// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Autenticar usando la API
    const response = await api.post('/auth/login', { email, password });
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Credenciales inválidas';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 401 }
      );
    }

    return NextResponse.json({
      token: response.data?.token,
      user: response.data?.user
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        error: "Error en el inicio de sesión",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
