'use client';

import { Bell, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, profile } = useAuthStore();

  return (
    <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-title font-semibold text-black truncate">
          {title || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Hide these buttons on mobile */}
        <button className="hidden md:flex p-2 rounded-lg hover:bg-cream-dark transition-colors" aria-label="Notificaciones">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
        <button className="hidden md:flex p-2 rounded-lg hover:bg-cream-dark transition-colors" aria-label="Configuración">
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
        
        {/* User profile - simplified on mobile */}
        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-100">
          <div className="hidden md:block text-right min-w-0">
            <p className="text-sm font-medium text-black truncate max-w-[120px]">
              {profile?.nombre || user?.email?.split('@')[0] || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500">
              {profile?.rol || 'Cajero'}
            </p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 md:w-5 md:h-5 text-black" />
          </div>
        </div>
      </div>
    </header>
  );
}
