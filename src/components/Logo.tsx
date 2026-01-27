interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <div className={`${sizeClasses[size]} bg-slate-950 rounded-xl flex items-center justify-center shadow-lg ${className}`}>
      <svg
        className={`${iconSizes[size]} text-sky-400`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pipeline icon: three stacked blocks with connectors */}
        {/* Top block */}
        <rect x="4" y="3" width="16" height="4" rx="1" fill="currentColor" />
        {/* Top-to-middle connector */}
        <rect x="10" y="7" width="4" height="3" fill="currentColor" />
        {/* Middle block */}
        <rect x="4" y="10" width="16" height="4" rx="1" fill="currentColor" />
        {/* Middle-to-bottom connector */}
        <rect x="10" y="14" width="4" height="3" fill="currentColor" />
        {/* Bottom block */}
        <rect x="4" y="17" width="16" height="4" rx="1" fill="currentColor" />
      </svg>
    </div>
  );
}

/**
 * Standalone pipeline icon SVG for use without the container
 */
export function PipelineIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pipeline icon: three stacked blocks with connectors */}
      <rect x="4" y="3" width="16" height="4" rx="1" fill="currentColor" />
      <rect x="10" y="7" width="4" height="3" fill="currentColor" />
      <rect x="4" y="10" width="16" height="4" rx="1" fill="currentColor" />
      <rect x="10" y="14" width="4" height="3" fill="currentColor" />
      <rect x="4" y="17" width="16" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}
