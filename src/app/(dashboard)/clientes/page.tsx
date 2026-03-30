'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, Button, Input, Modal, Textarea } from '@/components/ui';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Cliente } from '@/types';
import Link from 'next/link';

const clienteSchema = z.object({
  nombre_completo: z.string().min(2, 'El nombre es requerido'),
  telefono: z.string().min(8, 'Teléfono requerido'),
  correo: z.string().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  notas: z.string().optional(),
});

type ClienteForm = z.infer<typeof clienteSchema>;

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
  });

  useEffect(() => {
    fetchClientes();
  }, [search]);

  const fetchClientes = async () => {
    try {
      let query = supabase.from('clientes').select('*').order('created_at', { ascending: false });

      if (search) {
        query = query.or(
          `nombre_completo.ilike.%${search}%,telefono.ilike.%${search}%,correo.ilike.%${search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error fetching clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClienteForm) => {
    try {
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre_completo: data.nombre_completo,
            telefono: data.telefono,
            correo: data.correo || null,
            direccion: data.direccion || null,
            notas: data.notas || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCliente.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert({
          nombre_completo: data.nombre_completo,
          telefono: data.telefono,
          correo: data.correo || null,
          direccion: data.direccion || null,
          notas: data.notas || null,
        });

        if (error) throw error;
      }

      setModalOpen(false);
      setEditingCliente(null);
      reset();
      fetchClientes();
    } catch (error) {
      console.error('Error saving cliente:', error);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    reset({
      nombre_completo: cliente.nombre_completo,
      telefono: cliente.telefono,
      correo: cliente.correo || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
      fetchClientes();
    } catch (error) {
      console.error('Error deleting cliente:', error);
    }
  };

  const openNewModal = () => {
    setEditingCliente(null);
    reset({
      nombre_completo: '',
      telefono: '',
      correo: '',
      direccion: '',
      notas: '',
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-title font-bold text-black">Clientes</h1>
          <p className="text-gray-text mt-1">{clientes.length} clientes registrados</p>
        </div>
        <Button onClick={openNewModal}>
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-card border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      </Card>

      {/* Clients List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      ) : clientes.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-text">No hay clientes registrados</p>
          <Button onClick={openNewModal} className="mt-4">
            <Plus className="w-5 h-5" />
            Agregar Primer Cliente
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((cliente) => (
            <Link key={cliente.id} href={`/clientes/${cliente.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-black">{cliente.nombre_completo}</h3>
                    <div className="mt-3 space-y-2">
                      <p className="flex items-center gap-2 text-sm text-gray-text">
                        <Phone className="w-4 h-4" />
                        {cliente.telefono}
                      </p>
                      {cliente.correo && (
                        <p className="flex items-center gap-2 text-sm text-gray-text">
                          <Mail className="w-4 h-4" />
                          {cliente.correo}
                        </p>
                      )}
                      {cliente.direccion && (
                        <p className="flex items-center gap-2 text-sm text-gray-text">
                          <MapPin className="w-4 h-4" />
                          {cliente.direccion}
                        </p>
                      )}
                    </div>
                    {cliente.notas && (
                      <p className="mt-3 text-sm text-gray-text italic">{cliente.notas}</p>
                    )}
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(cliente)}
                      className="p-2 hover:bg-cream-dark rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gold" />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre Completo *"
            placeholder="Juan Pérez"
            {...register('nombre_completo')}
            error={errors.nombre_completo?.message}
          />
          <Input
            label="Teléfono *"
            placeholder="+54 11 1234 5678"
            {...register('telefono')}
            error={errors.telefono?.message}
          />
          <Input
            label="Email"
            placeholder="juan@email.com"
            {...register('correo')}
            error={errors.correo?.message}
          />
          <Input
            label="Dirección"
            placeholder="Calle 123, Ciudad"
            {...register('direccion')}
          />
          <Textarea
            label="Notas"
            placeholder="Observaciones adicionales..."
            {...register('notas')}
            rows={3}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
