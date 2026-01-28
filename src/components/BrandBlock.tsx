import { Link } from 'react-router-dom';

interface BrandBlockProps {
  /** Path to link to. If omitted or empty string, renders as a non-clickable div */
  linkTo?: string;
  /** Size variant: "header" for huge branding, "footer" for smaller */
  size?: 'header' | 'footer';
}

const sizeConfig = {
  header: {
    logo: 'h-20 sm:h-24 lg:h-28 w-auto',
    wordmark: 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900',
    gap: 'gap-5',
  },
  footer: {
    logo: 'h-10 sm:h-12 w-auto',
    wordmark: 'text-lg sm:text-xl font-bold tracking-tight text-slate-900',
    gap: 'gap-3',
  },
};

export function BrandBlock({ linkTo, size = 'header' }: BrandBlockProps) {
  const config = sizeConfig[size];

  const content = (
    <>
      <img
        src="/BrokerOps_Logo.png"
        alt="BrokerOps"
        className={config.logo}
      />
      <span className={config.wordmark}>
        BrokerOps
      </span>
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className={`flex items-center ${config.gap}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex items-center ${config.gap}`}>
      {content}
    </div>
  );
}
