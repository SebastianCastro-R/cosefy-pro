'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-gold text-black hover:bg-gold-dark focus:ring-gold',
      secondary: 'bg-black text-white hover:bg-gray-800 focus:ring-gray-500',
      outline: 'border-2 border-gold text-gold hover:bg-gold hover:text-black focus:ring-gold',
      ghost: 'text-gray-text hover:bg-cream-dark focus:ring-gray-300',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-5 py-2.5 text-base min-h-[44px]',
      lg: 'px-7 py-3 text-lg min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'rounded-btn font-medium transition-all duration-200 inline-flex items-center justify-center gap-2',
          'hover:transform hover:-translate-y-0.5 hover:shadow-gold',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cream',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
