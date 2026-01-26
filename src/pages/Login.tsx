import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  openLoginModal,
  onLogin,
  getCurrentUser,
  closeModal,
} from '../lib/netlifyIdentity';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to app
    const user = getCurrentUser();
    if (user) {
      navigate('/app');
      return;
    }

    // Listen for successful login
    onLogin(() => {
      closeModal();
      navigate('/app');
    });
  }, [navigate]);

  const handleLogin = () => {
    openLoginModal();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="font-semibold text-slate-900">
                Mortgage Agent Intake
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Staff Login
            </h1>
            <p className="text-slate-600 mb-8">
              Invite only. Contact admin for access.
            </p>

            <button
              onClick={handleLogin}
              className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
            >
              Log in
            </button>

            <p className="mt-6 text-sm text-slate-500">
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
