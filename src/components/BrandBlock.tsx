import { Link } from 'react-router-dom';

interface BrandBlockProps {
  /** Path to link to. If omitted or empty string, renders as a non-clickable div */
  linkTo?: string;
  /** Size variant: 'default' for footer, 'header' for site headers (huge) */
  size?: 'default' | 'header';
}

export function BrandBlock({ linkTo, size = 'default' }: BrandBlockProps) {
  const logoClass =
    size === 'header'
      ? 'h-16 sm:h-18 lg:h-20 w-auto'
      : 'h-10 sm:h-12 w-auto';

  const wordmarkClass =
    size === 'header'
      ? 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900'
      : 'text-lg sm:text-xl font-bold tracking-tight text-slate-900';

  const gap = size === 'header' ? 'gap-3' : 'gap-3';

  const content = (
    <>
      <img
        src="/BrokerOps_Logo_Cropped.png"
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
