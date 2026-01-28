import { Link } from 'react-router-dom';

interface BrandBlockProps {
  /** Path to link to. If omitted or empty string, renders as a non-clickable div */
  linkTo?: string;
  /** Size variant: 'default' for footer, 'header' for site headers (huge) */
  size?: 'default' | 'header';
}

export function BrandBlock({ linkTo, size = 'default' }: BrandBlockProps) {
  const logoClass = size === 'header'
    ? 'h-24 sm:h-28 lg:h-32 w-auto outline outline-2 outline-red-500 bg-yellow-200'
    : 'h-16 sm:h-20 w-auto';

  const wordmarkClass = size === 'header'
    ? 'text-3xl sm:text-4xl font-bold tracking-tight text-slate-900'
    : 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900';

  const content = (
    <>
      <img
        src="/BrokerOps_Logo.png?v=1"
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
      <Link to={linkTo} className="flex items-center gap-4" data-brand="header">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4" data-brand="header">
      {content}
    </div>
  );
}
