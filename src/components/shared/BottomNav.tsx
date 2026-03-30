'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Package, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/pedidos', label: 'Pedidos', icon: Package },
  { href: '/metricas', label: 'Métricas', icon: BarChart3 },
  { href: '/configuracion', label: 'Config', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom"
      aria-label="Navegación principal"
    >
      <ul className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px]',
                  'transition-colors duration-200',
                  isActive 
                    ? 'text-gold' 
                    : 'text-gray-400 hover:text-gray-600'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
