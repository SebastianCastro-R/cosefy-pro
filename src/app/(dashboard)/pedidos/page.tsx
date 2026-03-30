'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, Button, Badge } from '@/components/ui';
import { Plus, Search, Eye, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import type { Pedido, Cliente, PrendaTipo, Servicio } from '@/types';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const supabase = createClient();

  useEffect(() => {
    fetchPedidos();
  }, [filter, search]);

  const fetchPedidos = async () => {
    try {
      let query = supabase
        .from('pedidos')
        .select('*, cliente:clientes(nombre_completo, telefono)')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('estado', filter);
      }

      if (search) {
        query = query.or(
          `numero_pedido.ilike.%${search}%,cliente.nombre_completo.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Error fetching pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (pedidoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          estado: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'ENTREGADO' ? { fecha_entrega_real: new Date().toISOString() } : {}),
        })
        .eq('id', pedidoId);

      if (error) throw error;
      fetchPedidos();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'RECIBIDO', label: 'Recibido' },
    { value: 'EN_PROCESO', label: 'En Proceso' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ];

  const getNextStatus = (current: string): string | null => {
    const flow: Record<string, string> = {
      RECIBIDO: 'EN_PROCESO',
      EN_PROCESO: 'COMPLETADO',
      COMPLETADO: 'ENTREGADO',
    };
    return flow[current] || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-title font-bold text-black">Pedidos</h1>
          <p className="text-gray-text mt-1">{pedidos.length} pedidos encontrados</p>
        </div>
        <Link href="/pedidos/nuevo">
          <Button>
            <Plus className="w-5 h-5" />
            Nuevo Pedido
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text" />
            <input
              type="text"
              placeholder="Buscar por número de pedido o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-card border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === opt.value
                    ? 'bg-gold text-black'
                    : 'bg-cream-dark text-gray-text hover:bg-gold/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : pedidos.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-text">No hay pedidos registrados</p>
          <Link href="/pedidos/nuevo">
            <Button className="mt-4">
              <Plus className="w-5 h-5" />
              Crear Primer Pedido
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const nextStatus = getNextStatus(pedido.estado);
            return (
              <Card key={pedido.id} className="hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-black">
                        {pedido.numero_pedido}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.estado)}`}>
                        {getStatusLabel(pedido.estado)}
                      </span>
                    </div>
                    <p className="text-gray-text mt-1">
                      {(pedido.cliente as unknown as Cliente)?.nombre_completo || 'Cliente'} •{' '}
                      {(pedido.cliente as unknown as Cliente)?.telefono || ''}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-text">
                      <span>Recibido: {formatDate(pedido.fecha_recepcion)}</span>
                      <span>Entrega: {formatDate(pedido.fecha_entrega_estimada)}</span>
                      <span className="font-semibold text-gold">{formatCurrency(pedido.total)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {nextStatus && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(pedido.id, nextStatus)}
                      >
                        {nextStatus === 'EN_PROCESO' && 'Iniciar'}
                        {nextStatus === 'COMPLETADO' && 'Completar'}
                        {nextStatus === 'ENTREGADO' && 'Entregar'}
                      </Button>
                    )}
                    <Link href={`/pedidos/${pedido.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                        Ver
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
