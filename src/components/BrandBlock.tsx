import { Link } from 'react-router-dom';

interface BrandBlockProps {
  /** Path to link to. If omitted or empty string, renders as a non-clickable div */
  linkTo?: string;
  /** Size variant: 'header' for site headers (huge), 'footer' for footer */
  size?: 'header' | 'footer';
}

export function BrandBlock({ linkTo, size = 'footer' }: BrandBlockProps) {
  const logoClass = size === 'header'
    ? 'h-32 sm:h-36 lg:h-40 w-auto'
    : 'h-10 sm:h-12 w-auto';

  const wordmarkClass = size === 'header'
    ? 'text-4xl sm:text-5xl font-bold tracking-tight text-slate-900'
    : 'text-lg sm:text-xl font-bold tracking-tight text-slate-900';

  const gap = size === 'header' ? 'gap-6' : 'gap-3';

  const content = (
    <>
      <img
        src="/BrokerOps_Logo.png"
        alt="BrokerOps"
        className={logoClass}
      />
      <span className={wordmarkClass}>
        BrokerOps
      </span>
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className={`flex items-center ${gap}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex items-center ${gap}`}>
      {content}
    </div>
  );
}
