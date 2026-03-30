'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card, Button, Input, Select, Textarea } from '@/components/ui';
import ImageUpload from '@/components/ui/ImageUpload';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, Plus, Upload, User, Package, Calendar, DollarSign } from 'lucide-react';
import { generateOrderNumber, formatCurrency } from '@/lib/utils';
import type { Cliente, PrendaTipo, Servicio } from '@/types';

const pedidoSchema = z.object({
  cliente_id: z.string().min(1, 'Selecciona un cliente'),
  fecha_entrega_estimada: z.string().min(1, 'Selecciona fecha de entrega'),
  observaciones: z.string().optional(),
  items: z.array(
    z.object({
      prenda_tipo_id: z.string().min(1, 'Selecciona tipo de prenda'),
      servicio_id: z.string().optional(),
      servicio_personalizado: z.string().optional(),
      precio: z.number().min(0, 'Precio debe ser mayor a 0'),
      foto_url: z.string().optional(),
      observaciones: z.string().optional(),
    })
  ).min(1, 'Agrega al menos un item'),
});

type PedidoForm = z.infer<typeof pedidoSchema>;

export default function NuevoPedidoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [prendas, setPrendas] = useState<PrendaTipo[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCliente, setSearchCliente] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '' });
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PedidoForm>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      cliente_id: '',
      fecha_entrega_estimada: '',
      observaciones: '',
      items: [{ prenda_tipo_id: '', servicio_id: '', servicio_personalizado: '', precio: 0, observaciones: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedItems = watch('items');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [clientesRes, prendasRes, serviciosRes] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre_completo'),
        supabase.from('prendas_tipo').select('*').eq('activo', true).order('nombre'),
        supabase.from('servicios').select('*').eq('activo', true).order('nombre'),
      ]);

      setClientes(clientesRes.data || []);
      setPrendas(prendasRes.data || []);
      setServicios(serviciosRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre_completo.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.telefono.includes(searchCliente)
  );

  const selectCliente = (cliente: Cliente) => {
    setValue('cliente_id', cliente.id);
    setSearchCliente(cliente.nombre_completo);
    setShowClienteDropdown(false);
  };

  const getServiciosByPrenda = (prendaId: string) => {
    return servicios.filter(
      (s) => s.prenda_tipo_id === null || s.prenda_tipo_id === prendaId
    );
  };

  const updatePrecio = (index: number, servicioId: string) => {
    if (servicioId) {
      const servicio = servicios.find((s) => s.id === servicioId);
      if (servicio) {
        setValue(`items.${index}.precio`, servicio.precio_base);
      }
    }
  };

  const total = selectedItems.reduce((acc, item) => acc + (item.precio || 0), 0);

  const onSubmit = async (data: PedidoForm) => {
    setLoading(true);
    try {
      const numeroPedido = generateOrderNumber();

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: data.cliente_id,
          usuario_id: (await supabase.auth.getUser()).data.user?.id,
          numero_pedido: numeroPedido,
          fecha_recepcion: new Date().toISOString().split('T')[0],
          fecha_entrega_estimada: data.fecha_entrega_estimada,
          estado: 'RECIBIDO',
          total,
          observaciones: data.observaciones || null,
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      const detalles = data.items.map((item) => ({
        pedido_id: pedido.id,
        prenda_tipo_id: item.prenda_tipo_id,
        servicio_id: item.servicio_id || null,
        servicio_personalizado: item.servicio_personalizado || null,
        precio: item.precio,
        foto_url: item.foto_url || null,
        observaciones: item.observaciones || null,
      }));

      const { error: detallesError } = await supabase
        .from('pedidos_detalle')
        .insert(detalles);

      if (detallesError) throw detallesError;

      router.push('/pedidos');
    } catch (error) {
      console.error('Error creating pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearClienteRapido = () => {
    if (nuevoCliente.nombre && nuevoCliente.telefono) {
      supabase
        .from('clientes')
        .insert({
          nombre_completo: nuevoCliente.nombre,
          telefono: nuevoCliente.telefono,
        })
        .select()
        .single()
        .then(({ data }) => {
          if (data) {
            setValue('cliente_id', data.id);
            setSearchCliente(data.nombre_completo);
            setNuevoCliente({ nombre: '', telefono: '' });
          }
        });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-title font-bold text-black">Nuevo Pedido</h1>
        <p className="text-gray-text mt-1">Completa los datos del pedido</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cliente Selection */}
        <Card>
          <h2 className="text-xl font-title font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gold" />
            Cliente
          </h2>

          <div className="relative">
            <Input
              label="Buscar Cliente"
              placeholder="Escribe el nombre o teléfono..."
              value={searchCliente}
              onChange={(e) => {
                setSearchCliente(e.target.value);
                setShowClienteDropdown(true);
                setValue('cliente_id', '');
              }}
              onFocus={() => setShowClienteDropdown(true)}
            />

            {showClienteDropdown && filteredClientes.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-card shadow-lg max-h-60 overflow-auto">
                {filteredClientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => selectCliente(cliente)}
                    className="w-full text-left px-4 py-3 hover:bg-cream-dark transition-colors"
                  >
                    <p className="font-medium">{cliente.nombre_completo}</p>
                    <p className="text-sm text-gray-text">{cliente.telefono}</p>
                  </button>
                ))}
              </div>
            )}
            {errors.cliente_id && (
              <p className="text-red-500 text-sm mt-1">{errors.cliente_id.message}</p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-cream-dark">
            <p className="text-sm text-gray-text mb-2">¿Nuevo cliente?</p>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre"
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
              />
              <Input
                placeholder="Teléfono"
                value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
              />
              <Button type="button" onClick={handleCrearClienteRapido} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-title font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-gold" />
              Prendas y Servicios
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  prenda_tipo_id: '',
                  servicio_id: '',
                  servicio_personalizado: '',
                  precio: 0,
                  observaciones: '',
                })
              }
            >
              <Plus className="w-4 h-4" />
              Agregar Item
            </Button>
          </div>

          {errors.items?.message && (
            <p className="text-red-500 text-sm mb-4">{errors.items.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 bg-cream-dark rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Item {index + 1}</h3>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Tipo de Prenda *"
                    {...register(`items.${index}.prenda_tipo_id`)}
                    options={[
                      { value: '', label: 'Selecciona...' },
                      ...prendas.map((p) => ({ value: p.id, label: p.nombre })),
                    ]}
                    error={errors.items?.[index]?.prenda_tipo_id?.message}
                  />

                  <Select
                    label="Servicio"
                    {...register(`items.${index}.servicio_id`)}
                    options={[
                      { value: '', label: 'Selecciona o escribe personalizado...' },
                      ...getServiciosByPrenda(selectedItems[index]?.prenda_tipo_id || '').map((s) => ({
                        value: s.id,
                        label: `${s.nombre} - ${formatCurrency(s.precio_base)}`,
                      })),
                    ]}
                    onChange={(e) => updatePrecio(index, e.target.value)}
                  />

                  <Input
                    label="Servicio Personalizado"
                    placeholder="Si no está en la lista..."
                    {...register(`items.${index}.servicio_personalizado`)}
                  />

                  <Input
                    label="Precio *"
                    type="number"
                    {...register(`items.${index}.precio`, { valueAsNumber: true })}
                    error={errors.items?.[index]?.precio?.message}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    Foto de la prenda
                  </label>
                  <ImageUpload
                    value={selectedItems[index]?.foto_url || ''}
                    onChange={(url) => setValue(`items.${index}.foto_url`, url)}
                  />
                </div>

                <Textarea
                  label="Observaciones del item"
                  placeholder="Detalles adicionales..."
                  {...register(`items.${index}.observaciones`)}
                  className="mt-4"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery Date & Total */}
        <Card>
          <h2 className="text-xl font-title font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold" />
            Entrega y Observaciones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha de Entrega *"
              type="date"
              {...register('fecha_entrega_estimada')}
              error={errors.fecha_entrega_estimada?.message}
            />

            <div className="flex items-center gap-4 p-4 bg-gold/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-gold" />
              <div>
                <p className="text-sm text-gray-text">Total del Pedido</p>
                <p className="text-2xl font-bold text-gold">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>

          <Textarea
            label="Observaciones"
            placeholder="Notas generales del pedido..."
            {...register('observaciones')}
            className="mt-4"
            rows={3}
          />
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Crear Pedido
          </Button>
        </div>
      </form>
    </div>
  );
}
