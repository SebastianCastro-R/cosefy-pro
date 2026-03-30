'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setProfile, setLoading, loading } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        setUser(session.user);

        // Fetch user profile
        const { data: profile } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setProfile(profile);
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase, setUser, setProfile, setLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-gray-text">Cargando...</p>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/clientes')) return 'Clientes';
    if (pathname.startsWith('/pedidos')) return 'Pedidos';
    if (pathname.startsWith('/metricas')) return 'Métricas';
    if (pathname.startsWith('/configuracion')) return 'Configuración';
    return 'Cosefy Pro';
  };

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar onLogout={handleLogout} />
      <div className="lg:ml-64">
        <Header title={getPageTitle()} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
