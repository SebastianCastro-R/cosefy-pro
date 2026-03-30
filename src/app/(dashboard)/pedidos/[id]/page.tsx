'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card, Button, Badge } from '@/components/ui';
import { ArrowLeft, Package, User, Calendar, DollarSign, Clock, CheckCircle, Truck, PackageCheck } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

interface PedidoDetalle {
  id: string;
  pedido_id: string;
  prenda_tipo_id: string;
  servicio_id?: string;
  servicio_personalizado?: string;
  precio: number;
  foto_url?: string;
  observaciones?: string;
  created_at: string;
  prenda_tipo?: { nombre: string; icono?: string };
  servicio?: { nombre: string };
}

interface Pedido {
  id: string;
  numero_pedido: string;
  fecha_recepcion: string;
  fecha_entrega_estimada: string;
  fecha_entrega_real?: string;
  estado: string;
  total: number;
  observaciones?: string;
  created_at: string;
  cliente?: {
    id: string;
    nombre_completo: string;
    telefono: string;
    correo?: string;
    direccion?: string;
  };
  detalles?: PedidoDetalle[];
}

const statusFlow = [
  { status: 'RECIBIDO', label: 'Recibido', icon: Package, color: 'bg-blue-500' },
  { status: 'EN_PROCESO', label: 'En Proceso', icon: Clock, color: 'bg-yellow-500' },
  { status: 'COMPLETADO', label: 'Completado', icon: CheckCircle, color: 'bg-green-500' },
  { status: 'ENTREGADO', label: 'Entregado', icon: Truck, color: 'bg-gray-500' },
];

export default function PedidoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPedido();
  }, [params.id]);

  const fetchPedido = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          cliente:clientes(id, nombre_completo, telefono, correo, direccion),
          detalles:pedidos_detalle(
            *,
            prenda_tipo:prendas_tipo(nombre, icono),
            servicio:servicios(nombre)
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setPedido(data);
    } catch (error) {
      console.error('Error fetching pedido:', error);
      router.push('/pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!pedido) return;

    try {
      const updates: any = {
        estado: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'ENTREGADO') {
        updates.fecha_entrega_real = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('pedidos')
        .update(updates)
        .eq('id', pedido.id);

      if (error) throw error;
      fetchPedido();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getCurrentStatusIndex = () => {
    if (!pedido) return 0;
    return statusFlow.findIndex((s) => s.status === pedido.estado);
  };

  const getNextStatus = () => {
    const currentIndex = getCurrentStatusIndex();
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!pedido) {
    return null;
  }

  const nextStatus = getNextStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/pedidos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Info */}
        <div className="flex-1 space-y-6">
          {/* Order Header */}
          <Card>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-title font-bold text-black">
                  {pedido.numero_pedido}
                </h1>
                <p className="text-gray-text mt-1">
                  Creado el {formatDate(pedido.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pedido.estado)}`}>
                  {getStatusLabel(pedido.estado)}
                </span>
                {nextStatus && (
                  <Button size="sm" onClick={() => handleStatusChange(nextStatus.status)}>
                    {nextStatus.label}
                  </Button>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="mt-6 flex items-center justify-between">
              {statusFlow.map((step, index) => {
                const currentIndex = getCurrentStatusIndex();
                const isCompleted = index <= currentIndex;
                const Icon = step.icon;

                return (
                  <div key={step.status} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? step.color : 'bg-gray-200'} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs mt-1 ${isCompleted ? 'text-black font-medium' : 'text-gray-text'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < statusFlow.length - 1 && (
                      <div className={`w-16 md:w-24 h-1 mx-2 ${index < currentIndex ? 'bg-gold' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Client Info */}
          <Card>
            <h2 className="text-lg font-title font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gold" />
              Cliente
            </h2>
            <div className="space-y-2">
              <p className="font-medium">{pedido.cliente?.nombre_completo}</p>
              <p className="text-gray-text">{pedido.cliente?.telefono}</p>
              {pedido.cliente?.correo && (
                <p className="text-gray-text">{pedido.cliente?.correo}</p>
              )}
              {pedido.cliente?.direccion && (
                <p className="text-gray-text">{pedido.cliente?.direccion}</p>
              )}
            </div>
          </Card>

          {/* Items */}
          <Card>
            <h2 className="text-lg font-title font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gold" />
              Prendas ({pedido.detalles?.length || 0})
            </h2>
            <div className="space-y-4">
              {pedido.detalles?.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-cream-dark rounded-lg">
                  {item.foto_url && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      <Image
                        src={item.foto_url}
                        alt={item.prenda_tipo?.nombre || 'Prenda'}
                        width={80}
                        height={80}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {item.prenda_tipo?.icono} {item.prenda_tipo?.nombre}
                        </p>
                        <p className="text-sm text-gray-text">
                          {item.servicio?.nombre || item.servicio_personalizado || 'Servicio personalizado'}
                        </p>
                      </div>
                      <p className="font-semibold text-gold">{formatCurrency(item.precio)}</p>
                    </div>
                    {item.observaciones && (
                      <p className="text-sm text-gray-text mt-2">{item.observaciones}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Observations */}
          {pedido.observaciones && (
            <Card>
              <h2 className="text-lg font-title font-semibold mb-4">Observaciones</h2>
              <p className="text-gray-text">{pedido.observaciones}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-6">
          {/* Dates */}
          <Card>
            <h2 className="text-lg font-title font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              Fechas
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-text">Recibido:</span>
                <span className="font-medium">{formatDate(pedido.fecha_recepcion)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-text">Entrega estimada:</span>
                <span className="font-medium">{formatDate(pedido.fecha_entrega_estimada)}</span>
              </div>
              {pedido.fecha_entrega_real && (
                <div className="flex justify-between">
                  <span className="text-gray-text">Entregado:</span>
                  <span className="font-medium text-green-600">{formatDate(pedido.fecha_entrega_real)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Total */}
          <Card>
            <h2 className="text-lg font-title font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold" />
              Total
            </h2>
            <p className="text-3xl font-bold text-gold">{formatCurrency(pedido.total)}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
