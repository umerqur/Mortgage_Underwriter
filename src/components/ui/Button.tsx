import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  className?: string;
  href?: string;
  onClick?: () => void;
}

export function Button({ children, variant = 'primary', className = '', href, onClick }: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "bg-sky-600 text-white hover:bg-sky-700 shadow-md shadow-sky-600/20 focus:ring-sky-500",
    secondary: "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm focus:ring-slate-200",
    outline: "bg-transparent border-2 border-white/20 text-white hover:bg-white/10",
    ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`;

  if (href) {
    return <a href={href} className={classes}>{children}</a>;
  }

  return <button onClick={onClick} className={classes}>{children}</button>;
}
