import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Intake, IntakeUpload, Document } from '../lib/types';
import { getIntake, getActiveUploads } from '../lib/intakeService';
import {
  buildPdfBlob,
  generatePdfFilename,
  formatReportDate,
} from '../lib/pdfReport';

const categoryOrder = ['transaction', 'property', 'income', 'net_worth', 'existing_properties'] as const;

const categoryLabels: Record<string, string> = {
  transaction: 'Transaction Documents',
  property: 'Property Documents',
  income: 'Income Documents',
  net_worth: 'Net Worth Documents',
  existing_properties: 'Existing Properties',
};

export default function IntakeSummary() {
  const { intakeId } = useParams<{ intakeId: string }>();
  const navigate = useNavigate();

  const [intake, setIntake] = useState<Intake | null>(null);
  const [uploads, setUploads] = useState<IntakeUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const load = useCallback(async () => {
    if (!intakeId) return;
    try {
      setLoading(true);
      setError(null);
      const [intakeData, uploadsData] = await Promise.all([
        getIntake(intakeId),
        getActiveUploads(intakeId),
      ]);
      setIntake(intakeData);
      setUploads(uploadsData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load intake';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [intakeId]);

  useEffect(() => {
    load();
  }, [load]);

  // Group required docs by category
  const groupedDocs = (intake?.required_docs ?? []).reduce(
    (acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    },
    {} as Record<string, Document[]>,
  );

  // Build a set of doc_ids that have at least one non-deleted upload
  const uploadedDocIds = new Set(uploads.map((u) => u.doc_id).filter(Boolean));

  const totalDocs = intake?.required_docs.length ?? 0;
  const uploadedCount = intake?.required_docs.filter((d) => uploadedDocIds.has(d.id)).length ?? 0;
  const progressPct = totalDocs > 0 ? Math.round((uploadedCount / totalDocs) * 100) : 0;

  const hasAnyUpload = uploads.length > 0;

  const handleGeneratePdf = async () => {
    if (!intake) return;
    setPdfLoading(true);
    try {
      const reportDate = formatReportDate();
      const blob = await buildPdfBlob({
        formData: intake.form_answers,
        documents: intake.required_docs,
        reportDate,
      });
      const url = URL.createObjectURL(blob);
      const filename = generatePdfFilename(intake.client_first_name, intake.client_last_name);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportCrm = () => {
    if (!intake) return;
    const payload = {
      intake_id: intake.id,
      broker_name: intake.broker_name,
      client: {
        first_name: intake.client_first_name,
        last_name: intake.client_last_name,
        email: intake.client_email,
        phone: intake.client_phone,
      },
      created_at: intake.created_at,
      engine_tags: intake.engine_tags,
      required_docs: intake.required_docs.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        status: uploadedDocIds.has(d.id) ? 'uploaded' : 'missing',
      })),
      uploads: uploads.map((u) => ({
        id: u.id,
        doc_id: u.doc_id,
        file_name: u.file_name,
        mime_type: u.mime_type,
        size_bytes: u.size_bytes,
        created_at: u.created_at,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intake-${intake.id.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <p className="text-sm text-slate-500">Loading intake...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !intake) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-red-900">Could not load intake</h2>
            <p className="mt-2 text-sm text-red-700">{error ?? 'Intake not found'}</p>
            <button
              onClick={() => navigate('/app')}
              className="mt-6 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Back to Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  const createdDate = new Date(intake.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/app"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          New Intake
        </Link>

        {/* Header card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {intake.client_first_name} {intake.client_last_name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Broker: <span className="font-medium text-slate-700">{intake.broker_name}</span>
                <span className="mx-2 text-slate-300">|</span>
                {createdDate}
              </p>
            </div>
            <span className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 sm:mt-0">
              {totalDocs} documents required
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Upload Progress</span>
              <span className="font-semibold text-slate-900">
                {uploadedCount} / {totalDocs} uploaded
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  progressPct === 100
                    ? 'bg-green-500'
                    : progressPct > 0
                      ? 'bg-indigo-500'
                      : 'bg-slate-300'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/intake/${intakeId}/uploads`)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Documents
          </button>

          <button
            onClick={handleGeneratePdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {pdfLoading ? 'Generating...' : 'Generate PDF'}
          </button>

          <button
            onClick={handleExportCrm}
            disabled={!hasAnyUpload}
            title={!hasAnyUpload ? 'Upload at least one document first' : 'Export intake data as JSON'}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-500 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Export CRM JSON
          </button>
        </div>

        {/* Checklist grouped by category */}
        <div className="mt-8 space-y-6">
          {categoryOrder.map((category) => {
            const docs = groupedDocs[category];
            if (!docs || docs.length === 0) return null;

            return (
              <div key={category} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    {categoryLabels[category]}
                  </h3>
                </div>
                <ul className="divide-y divide-slate-100">
                  {docs.map((doc) => {
                    const hasUpload = uploadedDocIds.has(doc.id);
                    return (
                      <li key={doc.id} className="flex items-center gap-4 px-6 py-3.5">
                        {/* Status icon */}
                        {hasUpload ? (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-3.5 w-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100">
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                          </span>
                        )}

                        {/* Doc name */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                          {doc.note && (
                            <p className="mt-0.5 text-xs text-slate-500">{doc.note}</p>
                          )}
                        </div>

                        {/* Status pill */}
                        {hasUpload ? (
                          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                            Uploaded
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                            Missing
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {/* Empty state */}
          {totalDocs === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-sm text-slate-500">No documents required for this intake.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
