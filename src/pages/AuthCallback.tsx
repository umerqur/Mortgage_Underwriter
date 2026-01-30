import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const href = window.location.href;
      const code = new URL(href).searchParams.get('code');

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.log('Auth callback error:', exchangeError.message);
          setError(exchangeError.message);
          return;
        }
      } else {
        const hash = href.includes('#') ? href.split('#')[1] : '';
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sessionError) {
            console.log('Auth callback error:', sessionError.message);
            setError(sessionError.message);
            return;
          }
        } else {
          setError('No code or tokens found in callback URL');
          return;
        }
      }

      navigate('/app', { replace: true });
    }

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/login" className="text-sky-600 hover:text-sky-700">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-600">Signing you in...</p>
    </div>
  );
}
