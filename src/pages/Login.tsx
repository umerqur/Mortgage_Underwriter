import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase, isEmailAllowed } from '../lib/supabaseClient';
import { SiteHeader } from '../components/SiteHeader';

export default function Login() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    // If already logged in with allowed email, redirect to app
    if (!loading && session?.user?.email && isEmailAllowed(session.user.email)) {
      navigate('/app');
    }
  }, [session, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (!isEmailAllowed(normalizedEmail)) {
      setError('Access denied');
      setSubmitting(false);
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      setError(otpError.message);
      setSubmitting(false);
      return;
    }

    setLinkSent(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader variant="solid" />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-sky-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Staff Login
              </h1>
              <p className="text-slate-600">
                Invite only. Contact admin for access.
              </p>
            </div>

            {linkSent ? (
              <div className="text-center">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm mb-4">
                  Check your email for a secure sign in link.
                </div>
                <button
                  onClick={() => setLinkSent(false)}
                  className="text-sm text-sky-600 hover:text-sky-700"
                >
                  Try a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 rounded-lg shadow-sm transition-colors"
                >
                  {submitting ? 'Sending link...' : 'Sign in'}
                </button>
                <p className="text-sm text-slate-500 text-center mt-2">
                  We will email you a secure sign in link.
                </p>
              </form>
            )}

            <p className="mt-6 text-sm text-slate-500 text-center">
              <Link to="/" className="text-sky-600 hover:text-sky-700">
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
