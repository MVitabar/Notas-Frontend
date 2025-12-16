import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

interface AcademicPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'upcoming';
  description?: string;
}

// GET: Obtener todos los periodos académicos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const endpoint = status ? `/academic-periods?status=${status}` : '/academic-periods';
    const response = await api.get<{ data: AcademicPeriod[] }>(endpoint);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al obtener los periodos académicos';
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }
    
    return NextResponse.json(response.data?.data || []);
  } catch (error) {
    console.error("Error fetching academic periods:", error);
    return NextResponse.json(
      { 
        error: "Error al obtener los periodos académicos",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo periodo académico
export async function POST(request: NextRequest) {
  try {
    const periodData = await request.json();
    
    if (!periodData.name || !periodData.startDate || !periodData.endDate) {
      return NextResponse.json(
        { error: "Nombre, fecha de inicio y fecha de fin son requeridos" },
        { status: 400 }
      );
    }

    const response = await api.post<AcademicPeriod>('/academic-periods', {
      ...periodData,
      status: periodData.status || 'inactive'
    });
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al crear el período académico';
      
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
    console.error("Error creating academic period:", error);
    return NextResponse.json(
      { 
        error: "Error al crear el período académico",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un periodo académico
export async function PUT(request: NextRequest) {
  try {
    const periodData = await request.json();
    
    if (!periodData.id || !periodData.name || !periodData.startDate || !periodData.endDate) {
      return NextResponse.json(
        { error: "ID, nombre, fecha de inicio y fecha de fin son requeridos" },
        { status: 400 }
      );
    }

    const { id, ...updateData } = periodData;
    const response = await api.put<AcademicPeriod>(`/academic-periods/${id}`, updateData);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al actualizar el período académico';
      
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
    console.error("Error updating academic period:", error);
    return NextResponse.json(
      { 
        error: "Error al actualizar el período académico",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un periodo académico
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "ID del período es requerido" },
        { status: 400 }
      );
    }

    const response = await api.delete(`/academic-periods/${id}`);
    
    if (response.error) {
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : 'Error al eliminar el período académico';
      
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
    console.error("Error deleting academic period:", error);
    return NextResponse.json(
      { 
        error: "Error al eliminar el período académico",
        details: error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
