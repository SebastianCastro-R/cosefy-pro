'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, Button, Input, Modal, Select } from '@/components/ui';
import { Plus, Edit, Trash2, Save, Building2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';

const prendaSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  icono: z.string().optional(),
  descripcion: z.string().optional(),
});

const servicioSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  descripcion: z.string().optional(),
  precio_base: z.number().min(0, 'Precio requerido'),
  prenda_tipo_id: z.string().optional(),
});

const sucursalSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
});

const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Nombre requerido'),
  rol: z.enum(['ADMIN', 'CAJERO']),
});

type PrendaForm = z.infer<typeof prendaSchema>;
type ServicioForm = z.infer<typeof servicioSchema>;
type SucursalForm = z.infer<typeof sucursalSchema>;
type UsuarioForm = z.infer<typeof usuarioSchema>;

type TabType = 'prendas' | 'servicios' | 'sucursales' | 'usuarios';

export default function ConfiguracionPage() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('prendas');
  const [prendas, setPrendas] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const supabase = createClient();

  const { register: registerPrenda, handleSubmit: handlePrendaSubmit, reset: resetPrenda, formState: { errors: errorsPrenda } } = useForm<PrendaForm>({ resolver: zodResolver(prendaSchema) });
  const { register: registerServicio, handleSubmit: handleServicioSubmit, reset: resetServicio, formState: { errors: errorsServicio } } = useForm<ServicioForm>({ resolver: zodResolver(servicioSchema) });
  const { register: registerSucursal, handleSubmit: handleSucursalSubmit, reset: resetSucursal, formState: { errors: errorsSucursal } } = useForm<SucursalForm>({ resolver: zodResolver(sucursalSchema) });
  const { register: registerUsuario, handleSubmit: handleUsuarioSubmit, reset: resetUsuario, formState: { errors: errorsUsuario } } = useForm<UsuarioForm>({ resolver: zodResolver(usuarioSchema) });

  useEffect(() => {
    if (profile?.rol === 'ADMIN') {
      fetchData();
    }
  }, [profile, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prendasRes, serviciosRes, sucursalesRes, usuariosRes] = await Promise.all([
        supabase.from('prendas_tipo').select('*').order('nombre'),
        supabase.from('servicios').select('*').order('nombre'),
        supabase.from('sucursales').select('*').order('nombre'),
        supabase.from('perfiles').select('*').order('nombre'),
      ]);

      setPrendas(prendasRes.data || []);
      setServicios(serviciosRes.data || []);
      setSucursales(sucursalesRes.data || []);
      setUsuarios(usuariosRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prendas handlers
  const savePrenda = async (data: PrendaForm) => {
    try {
      if (editingItem) {
        await supabase.from('prendas_tipo').update({ nombre: data.nombre, icono: data.icono, descripcion: data.descripcion }).eq('id', editingItem.id);
      } else {
        await supabase.from('prendas_tipo').insert({ nombre: data.nombre, icono: data.icono, descripcion: data.descripcion, activo: true });
      }
      setModalOpen(false); resetPrenda(); setEditingItem(null); fetchData();
    } catch (error) {
      console.error('Error saving prenda:', error);
    }
  };
  const deletePrenda = async (id: string) => {
    if (!confirm('¿Eliminar esta prenda?')) return;
    await supabase.from('prendas_tipo').delete().eq('id', id);
    fetchData();
  };

  // Servicios handlers
  const saveServicio = async (data: ServicioForm) => {
    try {
      if (editingItem) {
        await supabase.from('servicios').update({ nombre: data.nombre, descripcion: data.descripcion, precio_base: data.precio_base, prenda_tipo_id: data.prenda_tipo_id || null }).eq('id', editingItem.id);
      } else {
        await supabase.from('servicios').insert({ nombre: data.nombre, descripcion: data.descripcion, precio_base: data.precio_base, prenda_tipo_id: data.prenda_tipo_id || null, activo: true });
      }
      setModalOpen(false); resetServicio(); setEditingItem(null); fetchData();
    } catch (error) {
      console.error('Error saving servicio:', error);
    }
  };
  const deleteServicio = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    await supabase.from('servicios').delete().eq('id', id);
    fetchData();
  };

  // Sucursales handlers
  const saveSucursal = async (data: SucursalForm) => {
    try {
      if (editingItem) {
        await supabase.from('sucursales').update({ nombre: data.nombre, direccion: data.direccion, telefono: data.telefono }).eq('id', editingItem.id);
      } else {
        await supabase.from('sucursales').insert({ nombre: data.nombre, direccion: data.direccion, telefono: data.telefono, activa: true });
      }
      setModalOpen(false); resetSucursal(); setEditingItem(null); fetchData();
    } catch (error) {
      console.error('Error saving sucursal:', error);
    }
  };
  const deleteSucursal = async (id: string) => {
    if (!confirm('¿Eliminar esta sucursal?')) return;
    await supabase.from('sucursales').delete().eq('id', id);
    fetchData();
  };

  // Usuarios handlers
  const saveUsuario = async (data: UsuarioForm) => {
    try {
      if (editingItem) {
        await supabase.from('perfiles').update({ nombre: data.nombre, rol: data.rol }).eq('id', editingItem.id);
      }
      setModalOpen(false); resetUsuario(); setEditingItem(null); fetchData();
    } catch (error) {
      console.error('Error saving usuario:', error);
    }
  };
  const deleteUsuario = async (id: string) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    await supabase.from('perfiles').update({ activo: false }).eq('id', id);
    fetchData();
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'prendas') resetPrenda({ nombre: item.nombre, icono: item.icono || '', descripcion: item.descripcion || '' });
    else if (activeTab === 'servicios') resetServicio({ nombre: item.nombre, descripcion: item.descripcion || '', precio_base: item.precio_base, prenda_tipo_id: item.prenda_tipo_id || '' });
    else if (activeTab === 'sucursales') resetSucursal({ nombre: item.nombre, direccion: item.direccion || '', telefono: item.telefono || '' });
    else if (activeTab === 'usuarios') resetUsuario({ nombre: item.nombre, rol: item.rol, email: item.email });
    setModalOpen(true);
  };

  const openNew = () => {
    setEditingItem(null);
    if (activeTab === 'prendas') resetPrenda({ nombre: '', icono: '', descripcion: '' });
    else if (activeTab === 'servicios') resetServicio({ nombre: '', descripcion: '', precio_base: 0, prenda_tipo_id: '' });
    else if (activeTab === 'sucursales') resetSucursal({ nombre: '', direccion: '', telefono: '' });
    else if (activeTab === 'usuarios') resetUsuario({ nombre: '', rol: 'CAJERO', email: '' });
    setModalOpen(true);
  };

  if (profile?.rol !== 'ADMIN') {
    return <Card className="text-center py-12"><p className="text-gray-text">No tienes acceso a esta sección</p></Card>;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner" /></div>;
  }

  const tabs = [
    { id: 'prendas', label: 'Prendas', icon: '👕' },
    { id: 'servicios', label: 'Servicios', icon: '🧵' },
    { id: 'sucursales', label: 'Sucursales', icon: '🏪' },
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
  ] as const;

  const renderList = (items: any[], onEdit: (item: any) => void, onDelete: (id: string) => void, showPrice = false) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-3 bg-cream-dark rounded-lg">
          <div>
            <p className="font-medium">{item.nombre}</p>
            {showPrice && <p className="text-sm text-gold">${item.precio_base}</p>}
            {item.direccion && <p className="text-sm text-gray-text">{item.direccion}</p>}
            {item.email && <p className="text-sm text-gray-text">{item.email}</p>}
            {item.rol && <span className={`text-xs px-2 py-0.5 rounded ${item.rol === 'ADMIN' ? 'bg-gold/20 text-gold' : 'bg-blue-100 text-blue-800'}`}>{item.rol}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(item)} className="p-2 hover:bg-white rounded-lg transition-colors"><Edit className="w-4 h-4 text-gold" /></button>
            <button onClick={() => onDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-gray-text py-4">No hay elementos</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-title font-bold text-black">Configuración</h1>
        <p className="text-gray-text mt-1">Administra tu taller</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-gold text-black' : 'bg-cream-dark text-gray-text hover:bg-gold/20'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-title font-semibold">{tabs.find(t => t.id === activeTab)?.label}</h2>
          <Button onClick={openNew}><Plus className="w-4 h-4" />Nuevo</Button>
        </div>
        {activeTab === 'prendas' && renderList(prendas, openEdit, deletePrenda)}
        {activeTab === 'servicios' && renderList(servicios, openEdit, deleteServicio, true)}
        {activeTab === 'sucursales' && renderList(sucursales, openEdit, deleteSucursal)}
        {activeTab === 'usuarios' && renderList(usuarios, openEdit, deleteUsuario)}
      </Card>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${editingItem ? 'Editar' : 'Nuevo'} ${tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}`}>
        {activeTab === 'prendas' && (
          <form onSubmit={handlePrendaSubmit(savePrenda)} className="space-y-4">
            <Input label="Nombre *" placeholder="Pantalón, Camisa..." {...registerPrenda('nombre')} error={errorsPrenda.nombre?.message} />
            <Input label="Icono" placeholder="👖" {...registerPrenda('icono')} />
            <Input label="Descripción" {...registerPrenda('descripcion')} />
            <div className="flex gap-3 pt-4"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1"><Save className="w-4 h-4" />Guardar</Button></div>
          </form>
        )}
        {activeTab === 'servicios' && (
          <form onSubmit={handleServicioSubmit(saveServicio)} className="space-y-4">
            <Input label="Nombre *" placeholder="Dobladillo, Cierre..." {...registerServicio('nombre')} error={errorsServicio.nombre?.message} />
            <Input label="Precio *" type="number" {...registerServicio('precio_base', { valueAsNumber: true })} error={errorsServicio.precio_base?.message} />
            <Input label="Descripción" {...registerServicio('descripcion')} />
            <select {...registerServicio('prenda_tipo_id')} className="w-full px-4 py-2.5 rounded-card border border-gray-200 bg-white">
              <option value="">A todas las prendas</option>
              {prendas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <div className="flex gap-3 pt-4"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1"><Save className="w-4 h-4" />Guardar</Button></div>
          </form>
        )}
        {activeTab === 'sucursales' && (
          <form onSubmit={handleSucursalSubmit(saveSucursal)} className="space-y-4">
            <Input label="Nombre *" {...registerSucursal('nombre')} error={errorsSucursal.nombre?.message} />
            <Input label="Dirección" {...registerSucursal('direccion')} />
            <Input label="Teléfono" {...registerSucursal('telefono')} />
            <div className="flex gap-3 pt-4"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1"><Save className="w-4 h-4" />Guardar</Button></div>
          </form>
        )}
        {activeTab === 'usuarios' && (
          <form onSubmit={handleUsuarioSubmit(saveUsuario)} className="space-y-4">
            <Input label="Email" {...registerUsuario('email')} error={errorsUsuario.email?.message} disabled={!!editingItem} />
            <Input label="Nombre *" {...registerUsuario('nombre')} error={errorsUsuario.nombre?.message} />
            <select {...registerUsuario('rol')} className="w-full px-4 py-2.5 rounded-card border border-gray-200 bg-white">
              <option value="CAJERO">Cajero</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <div className="flex gap-3 pt-4"><Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button><Button type="submit" className="flex-1"><Save className="w-4 h-4" />Guardar</Button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
