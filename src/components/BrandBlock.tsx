import { Link } from 'react-router-dom';

interface BrandBlockProps {
  /** Path to link to. If omitted or empty string, renders as a non-clickable div */
  linkTo?: string;
}

export function BrandBlock({ linkTo }: BrandBlockProps) {
  const content = (
    <>
      <img
        src="/BrokerOps_Logo.png"
        alt="BrokerOps"
        className="h-16 sm:h-20 w-auto"
      />
      <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
        BrokerOps
      </span>
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center gap-4">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {content}
    </div>
  );
}
