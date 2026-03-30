'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, Button } from '@/components/ui';
import { Users, Package, Clock, DollarSign, Plus, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils';
import type { Pedido, Cliente, DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalPedidos: 0,
    pedidosPendientes: 0,
    pedidosHoy: 0,
    pedidosManana: 0,
    gananciasMes: 0,
  });
  const [pedidosHoy, setPedidosHoy] = useState<Pedido[]>([]);
  const [pedidosManana, setPedidosManana] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fetch stats
      const [clientesRes, pedidosRes, pedidosHoyRes, pedidosMananaRes] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('pedidos').select('id', { count: 'exact', head: true }),
        supabase
          .from('pedidos')
          .select('*, cliente:clientes(nombre_completo)')
          .eq('fecha_entrega_estimada', todayStr)
          .in('estado', ['RECIBIDO', 'EN_PROCESO', 'COMPLETADO']),
        supabase
          .from('pedidos')
          .select('*, cliente:clientes(nombre_completo)')
          .eq('fecha_entrega_estimada', tomorrowStr)
          .in('estado', ['RECIBIDO', 'EN_PROCESO', 'COMPLETADO']),
      ]);

      // Calculate earnings this month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const { data: pedidosMes } = await supabase
        .from('pedidos')
        .select('total')
        .gte('created_at', firstDayOfMonth)
        .eq('estado', 'ENTREGADO');

      const gananciasMes = pedidosMes?.reduce((acc, p) => acc + (p.total || 0), 0) || 0;

      // Get pending orders
      const { count: pendientes } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .in('estado', ['RECIBIDO', 'EN_PROCESO', 'COMPLETADO']);

      setStats({
        totalClientes: clientesRes.count || 0,
        totalPedidos: pedidosRes.count || 0,
        pedidosPendientes: pendientes || 0,
        pedidosHoy: pedidosHoyRes.data?.length || 0,
        pedidosManana: pedidosMananaRes.data?.length || 0,
        gananciasMes,
      });

      setPedidosHoy(pedidosHoyRes.data || []);
      setPedidosManana(pedidosMananaRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Clientes',
      value: stats.totalClientes,
      icon: Users,
      color: 'text-gold',
    },
    {
      title: 'Pedidos Totales',
      value: stats.totalPedidos,
      icon: Package,
      color: 'text-blue-500',
    },
    {
      title: 'Pendientes',
      value: stats.pedidosPendientes,
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      title: 'Ganancias del Mes',
      value: formatCurrency(stats.gananciasMes),
      icon: DollarSign,
      color: 'text-green-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="animate-fadeIn">
        <h1 className="text-3xl font-title font-bold text-black">Bienvenido</h1>
        <p className="text-gray-text mt-1">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/clientes?modal=nuevo">
          <Button className="w-full h-16 text-base">
            <Plus className="w-5 h-5" />
            Agregar Cliente
          </Button>
        </Link>
        <Link href="/pedidos/nuevo">
          <Button variant="secondary" className="w-full h-16 text-base">
            <Package className="w-5 h-5" />
            Nuevo Pedido
          </Button>
        </Link>
        <Link href="/pedidos">
          <Button variant="outline" className="w-full h-16 text-base">
            <Calendar className="w-5 h-5" />
            Ver Pedidos
          </Button>
        </Link>
        <Link href="/metricas">
          <Button variant="ghost" className="w-full h-16 text-base">
            <DollarSign className="w-5 h-5" />
            Métricas
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="animate-slideUp"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-text">{stat.title}</p>
                <p className="text-3xl font-bold text-black mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Deliveries Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Deliveries */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-title font-semibold">Entregas de Hoy</h2>
            <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-sm font-medium">
              {pedidosHoy.length}
            </span>
          </div>
          {pedidosHoy.length === 0 ? (
            <p className="text-gray-text text-center py-8">No hay entregas para hoy</p>
          ) : (
            <div className="space-y-3">
              {pedidosHoy.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-3 bg-cream-dark rounded-lg"
                >
                  <div>
                    <p className="font-medium text-black">
                      {(pedido.cliente as unknown as Cliente)?.nombre_completo || 'Cliente'}
                    </p>
                    <p className="text-sm text-gray-text">{pedido.numero_pedido}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.estado)}`}>
                    {getStatusLabel(pedido.estado)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tomorrow's Deliveries */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-title font-semibold">Entregas de Mañana</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {pedidosManana.length}
            </span>
          </div>
          {pedidosManana.length === 0 ? (
            <p className="text-gray-text text-center py-8">No hay entregas para mañana</p>
          ) : (
            <div className="space-y-3">
              {pedidosManana.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-3 bg-cream-dark rounded-lg"
                >
                  <div>
                    <p className="font-medium text-black">
                      {(pedido.cliente as unknown as Cliente)?.nombre_completo || 'Cliente'}
                    </p>
                    <p className="text-sm text-gray-text">{pedido.numero_pedido}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.estado)}`}>
                    {getStatusLabel(pedido.estado)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
