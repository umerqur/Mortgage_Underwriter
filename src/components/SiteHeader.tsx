import { type ReactNode } from 'react'
import { BrandBlock } from './BrandBlock';
import { Container } from './ui/Container';

interface SiteHeaderProps {
  /** Content for the left side (contextual navigation links) */
  leftSlot?: ReactNode;
  /** Content for the right side (buttons like Log in, Log out) */
  rightSlot?: ReactNode;
  /** Variant: 'overlay' for landing hero, 'solid' for login and app pages */
  variant?: 'overlay' | 'solid';
}

export function SiteHeader({ leftSlot, rightSlot, variant = 'solid' }: SiteHeaderProps) {
  const headerClasses = variant === 'overlay'
    ? 'absolute top-0 left-0 right-0 z-50'
    : 'bg-white border-b border-slate-200 shadow-sm';

  return (
    <header className={headerClasses}>
      <Container>
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="shrink-0">
              <BrandBlock size="header" linkTo={variant === 'solid' ? '/' : undefined} />
            </div>
            {leftSlot && (
              <div className="flex items-center min-w-0">
                {leftSlot}
              </div>
            )}
          </div>
          {rightSlot && (
            <div className="flex items-center min-w-0">
              {rightSlot}
            </div>
          )}
        </div>
      </Container>
    </header>
  );
}
