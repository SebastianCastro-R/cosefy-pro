'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card, Button, Badge } from '@/components/ui';
import { ArrowLeft, Phone, Mail, MapPin, Package, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import Link from 'next/link';

interface Pedido {
  id: string;
  numero_pedido: string;
  fecha_recepcion: string;
  fecha_entrega_estimada: string;
  estado: string;
  total: number;
  created_at: string;
}

interface Cliente {
  id: string;
  nombre_completo: string;
  telefono: string;
  correo?: string;
  direccion?: string;
  notas?: string;
  created_at: string;
}

export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // Fetch cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', params.id)
        .single();

      if (clienteError) throw clienteError;
      setCliente(clienteData);

      // Fetch pedidos
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', params.id)
        .order('created_at', { ascending: false });

      if (pedidosError) throw pedidosError;
      setPedidos(pedidosData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      router.push('/clientes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  const totalGastado = pedidos.reduce((acc, p) => acc + p.total, 0);
  const pedidosCompletados = pedidos.filter(p => p.estado === 'ENTREGADO').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Client Info */}
        <div className="lg:w-80 space-y-6">
          <Card>
            <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-black">
                {cliente.nombre_completo.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-title font-bold text-center">{cliente.nombre_completo}</h1>
            
            <div className="mt-6 space-y-3">
              <p className="flex items-center gap-3 text-gray-text">
                <Phone className="w-4 h-4" />
                {cliente.telefono}
              </p>
              {cliente.correo && (
                <p className="flex items-center gap-3 text-gray-text">
                  <Mail className="w-4 h-4" />
                  {cliente.correo}
                </p>
              )}
              {cliente.direccion && (
                <p className="flex items-center gap-3 text-gray-text">
                  <MapPin className="w-4 h-4" />
                  {cliente.direccion}
                </p>
              )}
            </div>

            {cliente.notas && (
              <div className="mt-6 p-4 bg-cream-dark rounded-lg">
                <p className="text-sm text-gray-text">{cliente.notas}</p>
              </div>
            )}

            <p className="text-sm text-gray-text mt-6 text-center">
              Cliente desde {formatDate(cliente.created_at)}
            </p>
          </Card>

          {/* Stats */}
          <Card>
            <h2 className="text-lg font-title font-semibold mb-4">Estadísticas</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-text">Total pedidos</span>
                <span className="font-bold text-lg">{pedidos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-text">Completados</span>
                <span className="font-bold text-lg text-green-600">{pedidosCompletados}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-text">Total gastado</span>
                <span className="font-bold text-lg text-gold">{formatCurrency(totalGastado)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Orders History */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-title font-semibold">Historial de Pedidos</h2>
            <Link href="/pedidos/nuevo">
              <Button size="sm">
                <Package className="w-4 h-4" />
                Nuevo Pedido
              </Button>
            </Link>
          </div>

          {pedidos.length === 0 ? (
            <Card className="text-center py-12">
              <Package className="w-12 h-12 text-gray-text mx-auto mb-4" />
              <p className="text-gray-text">Este cliente no tiene pedidos</p>
              <Link href="/pedidos/nuevo">
                <Button className="mt-4">Crear Primer Pedido</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {pedidos.map((pedido) => (
                <Link key={pedido.id} href={`/pedidos/${pedido.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{pedido.numero_pedido}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.estado)}`}>
                            {getStatusLabel(pedido.estado)}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-gray-text">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(pedido.fecha_recepcion)}
                          </span>
                          <span>→</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(pedido.fecha_entrega_estimada)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gold">{formatCurrency(pedido.total)}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
