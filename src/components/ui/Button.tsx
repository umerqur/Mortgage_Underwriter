import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  className?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  href,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary:
      'bg-black text-white hover:bg-slate-800 active:bg-slate-900 shadow-md shadow-black/20 focus:ring-slate-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed',
    secondary:
      'bg-white text-slate-900 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 shadow-sm focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed',
    outline:
      'bg-transparent border-2 border-white/20 text-white hover:bg-white/10 active:bg-white/20 disabled:border-white/10 disabled:text-white/40 disabled:cursor-not-allowed',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-300 disabled:bg-transparent disabled:cursor-not-allowed',
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`;
  const isDisabled = disabled || loading;

  if (href && !isDisabled) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={classes}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
