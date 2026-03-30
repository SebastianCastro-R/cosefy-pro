'use client';

import { Bell, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, profile } = useAuthStore();

  return (
    <header className="bg-white shadow-soft px-6 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-title font-semibold text-black">
          {title || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg hover:bg-cream-dark transition-colors">
          <Bell className="w-5 h-5 text-gray-text" />
        </button>
        <button className="p-2 rounded-lg hover:bg-cream-dark transition-colors">
          <Settings className="w-5 h-5 text-gray-text" />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-cream-dark">
          <div className="text-right">
            <p className="text-sm font-medium text-black">
              {profile?.nombre || user?.email?.split('@')[0] || 'Usuario'}
            </p>
            <p className="text-xs text-gray-text">
              {profile?.rol || 'Cajero'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
            <User className="w-5 h-5 text-black" />
          </div>
        </div>
      </div>
    </header>
  );
}
