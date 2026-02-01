import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { SiteHeader } from './SiteHeader';

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { intakeId } = useParams<{ intakeId: string }>();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Determine context-aware left link
  let leftLink: { text: string; href: string } | null = null;

  if (intakeId && location.pathname.startsWith('/intake/')) {
    leftLink = { text: 'All Intakes', href: '/intakes' };
  } else if (location.pathname === '/intakes') {
    leftLink = { text: 'New Intake', href: '/app' };
  } else if (location.pathname === '/app') {
    leftLink = { text: 'All Intakes', href: '/intakes' };
  }

  return (
    <SiteHeader
      variant="solid"
      leftSlot={
        leftLink && (
          <Link
            to={leftLink.href}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {leftLink.text}
          </Link>
        )
      }
      rightSlot={
        <div className="flex items-center gap-3 min-w-0">
          {user && (
            <span className="hidden sm:block text-sm text-slate-600 truncate max-w-48">
              {user.email}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      }
    />
  );
}
