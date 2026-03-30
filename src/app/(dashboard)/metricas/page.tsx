'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, Select } from '@/components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { DollarSign, TrendingUp, Users, Package, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#D4AF37', '#B8941F', '#E5C76B', '#8B7355', '#666666', '#999999'];

export default function MetricasPage() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [metricas, setMetricas] = useState({
    ganancias: 0,
    promedioPedido: 0,
    totalPedidos: 0,
    clientesNuevos: 0,
    tiempoPromedioEntrega: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [topPrendas, setTopPrendas] = useState<any[]>([]);
  const [topServicios, setTopServicios] = useState<any[]>([]);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchMetricas();
  }, [periodo]);

  const fetchMetricas = async () => {
    try {
      setLoading(true);

      const fechaInicio = new Date();
      if (periodo === 'semana') {
        fechaInicio.setDate(fechaInicio.getDate() - 7);
      } else if (periodo === 'mes') {
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
      } else if (periodo === 'anio') {
        fechaInicio.setFullYear(fechaInicio.getFullYear() - 1);
      }

      // Fetch pedidos
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('*, cliente:clientes(nombre_completo), detalles:pedidos_detalle(*)')
        .gte('created_at', fechaInicio.toISOString())
        .eq('estado', 'ENTREGADO');

      // Fetch all data for charts
      const [pedidosMes, clientesData, prendasData, serviciosData] = await Promise.all([
        supabase
          .from('pedidos')
          .select('created_at, total')
          .gte('created_at', fechaInicio.toISOString())
          .eq('estado', 'ENTREGADO'),
        supabase
          .from('clientes')
          .select('created_at')
          .gte('created_at', fechaInicio.toISOString()),
        supabase.from('prendas_tipo').select('id, nombre'),
        supabase.from('servicios').select('id, nombre'),
      ]);

      const prendasList = prendasData.data || [];
      const serviciosList = serviciosData.data || [];

      // Calculate metrics
      const ganancias = pedidos?.reduce((acc, p) => acc + (p.total || 0), 0) || 0;
      const promedio = pedidos?.length ? ganancias / pedidos.length : 0;

      setMetricas({
        ganancias,
        promedioPedido: promedio,
        totalPedidos: pedidos?.length || 0,
        clientesNuevos: clientesData.data?.length || 0,
        tiempoPromedioEntrega: 0,
      });

      // Calculate average delivery time
      const { data: pedidosEntregados } = await supabase
        .from('pedidos')
        .select('fecha_recepcion, fecha_entrega_real')
        .eq('estado', 'ENTREGADO')
        .not('fecha_entrega_real', 'is', null);

      let tiempoPromedio = 0;
      if (pedidosEntregados && pedidosEntregados.length > 0) {
        const totalDias = pedidosEntregados.reduce((acc, p) => {
          const recepcion = new Date(p.fecha_recepcion);
          const entrega = new Date(p.fecha_entrega_real);
          const dias = Math.floor((entrega.getTime() - recepcion.getTime()) / (1000 * 60 * 60 * 24));
          return acc + dias;
        }, 0);
        tiempoPromedio = totalDias / pedidosEntregados.length;
      }

      setMetricas(prev => ({ ...prev, tiempoPromedioEntrega: Math.round(tiempoPromedio * 10) / 10 }));

      // Prepare chart data (earnings by day)
      const byDay: Record<string, number> = {};
      pedidosMes.data?.forEach((p) => {
        const day = new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        byDay[day] = (byDay[day] || 0) + p.total;
      });

      setChartData(
        Object.entries(byDay).map(([name, value]) => ({
          name,
          value: Math.round(value),
        }))
      );

      // Top Prendas
      const prendaCount: Record<string, number> = {};
      pedidos?.forEach((p: any) => {
        p.detalles?.forEach((d: any) => {
          const prenda = prendasList.find((x: any) => x.id === d.prenda_tipo_id);
          if (prenda) {
            prendaCount[prenda.nombre] = (prendaCount[prenda.nombre] || 0) + 1;
          }
        });
      });

      setTopPrendas(
        Object.entries(prendaCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      );

      // Top Servicios
      const servicioCount: Record<string, number> = {};
      pedidos?.forEach((p: any) => {
        p.detalles?.forEach((d: any) => {
          if (d.servicio_id) {
            const servicio = serviciosList.find((x: any) => x.id === d.servicio_id);
            if (servicio) {
              servicioCount[servicio.nombre] = (servicioCount[servicio.nombre] || 0) + 1;
            }
          } else if (d.servicio_personalizado) {
            servicioCount[d.servicio_personalizado] = (servicioCount[d.servicio_personalizado] || 0) + 1;
          }
        });
      });

      setTopServicios(
        Object.entries(servicioCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      );

      // Top Clientes
      const clienteCount: Record<string, number> = {};
      pedidos?.forEach((p: any) => {
        if (p.cliente?.nombre_completo) {
          clienteCount[p.cliente.nombre_completo] = (clienteCount[p.cliente.nombre_completo] || 0) + 1;
        }
      });

      setTopClientes(
        Object.entries(clienteCount)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      );
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Ganancias',
      value: formatCurrency(metricas.ganancias),
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Pedidos',
      value: metricas.totalPedidos,
      icon: Package,
      color: 'text-blue-500',
    },
    {
      title: 'Promedio/Pedido',
      value: formatCurrency(metricas.promedioPedido),
      icon: TrendingUp,
      color: 'text-gold',
    },
    {
      title: 'Clientes Nuevos',
      value: metricas.clientesNuevos,
      icon: Users,
      color: 'text-purple-500',
    },
    {
      title: 'Tiempo Promedio Entrega',
      value: `${metricas.tiempoPromedioEntrega} días`,
      icon: Clock,
      color: 'text-orange-500',
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-title font-bold text-black">Métricas</h1>
          <p className="text-gray-text mt-1">Análisis de tu taller</p>
        </div>
        <Select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          options={[
            { value: 'semana', label: 'Última Semana' },
            { value: 'mes', label: 'Último Mes' },
            { value: 'anio', label: 'Último Año' },
          ]}
          className="w-40"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-text">{stat.title}</p>
                <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ganancias Chart */}
        <Card>
          <h2 className="text-xl font-title font-semibold mb-4">Ganancias</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Ganancias']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Prendas */}
        <Card>
          <h2 className="text-xl font-title font-semibold mb-4">Prendas Más Solicitadas</h2>
          {topPrendas.length === 0 ? (
            <p className="text-gray-text text-center py-8">No hay datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topPrendas}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {topPrendas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top Servicios */}
        <Card>
          <h2 className="text-xl font-title font-semibold mb-4">Servicios Más Solicitados</h2>
          {topServicios.length === 0 ? (
            <p className="text-gray-text text-center py-8">No hay datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topServicios} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#B8941F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top Clientes */}
        <Card>
          <h2 className="text-xl font-title font-semibold mb-4">Mejores Clientes</h2>
          {topClientes.length === 0 ? (
            <p className="text-gray-text text-center py-8">No hay datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClientes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#E5C76B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
