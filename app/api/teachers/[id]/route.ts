// app/api/teachers/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

// GET: Ver perfil docente (admin/self)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await api.get(`/teachers/${params.id}`);
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error || "Error al obtener el docente" },
        { status: response.status || 500 }
      );
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { error: "Error al obtener el docente" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar docente (admin/self)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updateData = await request.json();
    
    // Remove fields that shouldn't be updated
    const { id, email, role, ...safeUpdateData } = updateData;
    
    const response = await api.put(`/teachers/${params.id}`, safeUpdateData);
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error || "Error al actualizar el docente" },
        { status: response.status || 500 }
      );
    }
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json(
      { error: "Error al actualizar el docente" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar docente (admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const response = await api.delete(`/teachers/${params.id}`);
    
    if (response.error) {
      return NextResponse.json(
        { error: response.error || "Error al eliminar el docente" },
        { status: response.status || 500 }
      );
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json(
      { error: "Error al eliminar el docente" },
      { status: 500 }
    );
  }
}
