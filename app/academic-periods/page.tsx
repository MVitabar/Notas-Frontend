// app/academic-periods/page.tsx
"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Calendar, Plus, Edit, Trash2, CheckCircle, Clock, Save, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { academicPeriodService, type AcademicPeriod } from "@/lib/services/academicPeriodService"

type StatusType = 'upcoming' | 'active' | 'completed' | 'cancelled';

interface AcademicPeriodFormData {
  name: string;
  startDate: string;
  endDate: string;
  status: StatusType;
  description?: string;
  isCurrent?: boolean;
}

export default function AcademicPeriodsPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  const [formData, setFormData] = useState<AcademicPeriodFormData>({
    name: "",
    startDate: "",
    endDate: "",
    status: "upcoming",
    description: "",
    isCurrent: false
  });

  // Obtener períodos
  const { 
    data: periods = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['academicPeriods'],
    queryFn: () => academicPeriodService.getAllPeriods(),
  });

  // Obtener período actual
  const { data: currentPeriod } = useQuery({
    queryKey: ['currentAcademicPeriod'],
    queryFn: () => academicPeriodService.getCurrentPeriod(),
  });

  // Mutación para crear un nuevo período
  const createMutation = useMutation({
    mutationFn: (data: AcademicPeriodFormData) => academicPeriodService.createPeriod({
      ...data,
      isCurrent: data.isCurrent || false,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : new Date().toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicPeriods'] });
      queryClient.invalidateQueries({ queryKey: ['currentAcademicPeriod'] });
      toast.success("Período académico creado correctamente");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        status: "upcoming",
        description: "",
        isCurrent: false
      });
    },
    onError: (error: any) => {
      console.error('Error creating period:', error);
      toast.error(error.response?.data?.message || "Error al crear el período académico");
      console.error(error);
    }
  });

  // Mutación para actualizar un período
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AcademicPeriod> }) => 
      academicPeriodService.updatePeriod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicPeriods', 'currentAcademicPeriod'] });
      toast.success("Período académico actualizado correctamente");
      setIsEditDialogOpen(false);
      setSelectedPeriod(null);
    },
    onError: (error) => {
      toast.error("Error al actualizar el período académico");
      console.error(error);
    }
  });

  // Mutación para eliminar un período
  const deleteMutation = useMutation({
    mutationFn: (id: string) => academicPeriodService.deletePeriod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academicPeriods'] });
      toast.success("Período académico eliminado correctamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar el período académico");
      console.error(error);
    }
  });

  // Función para manejar la creación de un nuevo período
  const handleCreatePeriod = () => {
    if (!validateDates(formData.startDate, formData.endDate)) {
      toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }
    
    // Ensure isCurrent is a boolean
    const dataToSubmit = {
      ...formData,
      isCurrent: formData.isCurrent || false,
    };
    
    createMutation.mutate(dataToSubmit);
  };

  // Función para manejar la actualización de un período
  const handleUpdatePeriod = async () => {
    if (!selectedPeriod) return;
    if (!validateDates(formData.startDate, formData.endDate)) {
      toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }
    
    try {
      await updateMutation.mutateAsync({ 
        id: selectedPeriod.id, 
        data: {
          ...formData,
          isCurrent: formData.isCurrent || false,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        } 
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating period:', error);
      toast.error("Error al actualizar el período");
    }
  };

  // Función para manejar la eliminación de un período
  const handleDeletePeriod = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este período académico?")) {
      deleteMutation.mutate(id);
    }
  };

  // Función para manejar la activación de un período
  const handleActivatePeriod = async (id: string) => {
    try {
      await academicPeriodService.activatePeriod(id);
      queryClient.invalidateQueries({ queryKey: ['academicPeriods', 'currentAcademicPeriod'] });
      toast.success("Período activado correctamente");
    } catch (error) {
      toast.error("Error al activar el período");
      console.error(error);
    }
  };

  // Función para abrir el diálogo de edición
  const openEditDialog = (period: AcademicPeriod) => {
    setSelectedPeriod(period);
    setFormData({
      name: period.name,
      startDate: period.startDate ? period.startDate.split('T')[0] : '',
      endDate: period.endDate ? period.endDate.split('T')[0] : '',
      status: period.status,
      description: period.description || "",
      isCurrent: period.isCurrent || false,
    });
    setIsEditDialogOpen(true);
  };

  // Validar fechas
  const validateDates = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) < new Date(endDate);
  };

  // Calcular días transcurridos y total de días
  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysElapsed = Math.min(
      Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))),
      totalDays
    );
    
    return { totalDays, daysElapsed };
  };

  // Obtener el progreso del período
  const getProgressPercentage = (period: AcademicPeriod) => {
    if (period.status === 'completed' || period.status === 'cancelled') return 100;
    if (period.status === 'upcoming') return 0;
    
    const { totalDays, daysElapsed } = calculateDays(period.startDate, period.endDate);
    return Math.round((daysElapsed / totalDays) * 100);
  };

  // Obtener el estado del período
  const getPeriodStatus = (period: AcademicPeriod): StatusType => {
    // Si el estado ya está definido y no es 'upcoming', lo devolvemos tal cual
    if (period.status !== 'upcoming') {
      return period.status;
    }
    
    // Si el estado es 'upcoming', verificamos las fechas
    const today = new Date();
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    if (today < startDate) return 'upcoming';
    if (today > endDate) return 'completed';
    return 'active';
  };

  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Mostrar error si hay un problema al cargar los datos
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar los períodos académicos. Por favor, inténtalo de nuevo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Períodos Académicos</h1>
                <p className="text-sm text-gray-600">Gestión de bimestres y ciclos escolares</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Período
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Período Académico</DialogTitle>
                  <DialogDescription>Define un nuevo período académico</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre del Período</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Primer Bimestre 2024"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Inicio</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Fin</Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: StatusType) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Próximo</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción (Opcional)</Label>
                    <Input
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setFormData({
                          name: "",
                          startDate: "",
                          endDate: "",
                          status: "upcoming",
                          description: "",
                          isCurrent: false
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreatePeriod}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? 'Creando...' : 'Crear Período'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto p-4 pt-6">
        <div className="flex flex-col">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Período</TableHead>
                  <TableHead>Fecha de Inicio</TableHead>
                  <TableHead>Fecha de Fin</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-900">{period.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-900">{format(parseISO(period.startDate), 'dd MMM yyyy', { locale: es })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-900">{format(parseISO(period.endDate), 'dd MMM yyyy', { locale: es })}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              getPeriodStatus(period) === 'completed' || getPeriodStatus(period) === 'cancelled'
                                ? 'bg-green-500'
                                : getPeriodStatus(period) === 'active'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                            }`}
                            style={{ width: `${getProgressPercentage(period)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{getProgressPercentage(period)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getPeriodStatus(period) === 'active'
                            ? 'default'
                            : getPeriodStatus(period) === 'completed' || getPeriodStatus(period) === 'cancelled'
                            ? 'secondary'
                            : 'outline'
                        }
                        className={
                          getPeriodStatus(period) === 'active'
                            ? 'bg-green-100 text-green-800'
                            : getPeriodStatus(period) === 'completed' || getPeriodStatus(period) === 'cancelled'
                            ? 'bg-gray-100 text-gray-800'
                            : ''
                        }
                      >
                        {getPeriodStatus(period) === 'active'
                          ? 'Activo'
                          : getPeriodStatus(period) === 'completed'
                          ? 'Completado'
                          : getPeriodStatus(period) === 'cancelled'
                          ? 'Cancelado'
                          : 'Próximo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(period)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePeriod(period.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {period.status === 'upcoming' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivatePeriod(period.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Período Académico</DialogTitle>
            <DialogDescription>Actualiza la información del período académico</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Período</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Primer Bimestre 2024"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: StatusType) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Próximo</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción (Opcional)</Label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedPeriod(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdatePeriod}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}