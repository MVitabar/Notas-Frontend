// app/api/teachers/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

// GET: Ver perfil docente (admin/self)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const response = await api.get(`/auth/teachers/${id}`);
    
    if (!response.data) {
      return NextResponse.json(
        { error: "No se encontró el docente" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error fetching teacher:", error);
    
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.message || "Error al obtener el docente" },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { error: "Error al obtener el docente" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar docente (admin/self)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Remove sensitive fields that shouldn't be updated
    const { email, role, ...rest } = body;
    
    // Prepare update data, explicitly including materias and grados
    const safeUpdateData = {
      ...rest,
      materias: Array.isArray(body.materias) ? body.materias : [],
      grados: Array.isArray(body.grados) ? body.grados : []
    };
    
    const response = await api.put(`/auth/teachers/${id}`, safeUpdateData);
    
    if (!response.data) {
      return NextResponse.json(
        { error: "No se pudo actualizar el docente" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error updating teacher:", error);
    
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.message || "Error al actualizar el docente" },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { error: "Error al actualizar el docente" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar docente (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const response = await api.delete(`/auth/teachers/${id}`);
    
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    
    if (!response.data) {
      return NextResponse.json(
        { error: "No se pudo eliminar el docente" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting teacher:", error);
    
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.message || "Error al eliminar el docente" },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { error: "Error al eliminar el docente" },
      { status: 500 }
    );
  }
}
