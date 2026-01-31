import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface IntakeRow {
  id: string;
  created_at: string;
  broker_name: string;
  client_first_name: string;
  client_last_name: string;
}

export default function IntakesList() {
  const [intakes, setIntakes] = useState<IntakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIntakes() {
      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from('intakes')
          .select('id, created_at, broker_name, client_first_name, client_last_name')
          .order('created_at', { ascending: false })
          .limit(20);

        if (queryError) throw queryError;
        setIntakes(data ?? []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load intakes';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchIntakes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <p className="text-sm text-slate-500">Loading intakes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-red-900">Could not load intakes</h2>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            All Intakes
          </h1>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Intake
          </Link>
        </div>

        {/* Intakes list */}
        {intakes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-sm text-slate-500">No intakes yet.</p>
            <Link
              to="/app"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              Create Your First Intake
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {intakes.map((intake) => {
                const date = new Date(intake.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <li key={intake.id}>
                    <Link
                      to={`/intake/${intake.id}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {intake.client_first_name} {intake.client_last_name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Broker: {intake.broker_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400">{date}</span>
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
