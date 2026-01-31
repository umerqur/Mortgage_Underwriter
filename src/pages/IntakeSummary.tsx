import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Intake, IntakeUpload, Document } from '../lib/types';
import { fetchIntake, fetchUploads } from '../lib/intakeService';
import {
  buildPdfBlob,
  generatePdfFilename,
  formatReportDate,
} from '../lib/pdfReport';
import { Button } from '../components/ui/Button';

const categoryLabels: Record<Document['category'], string> = {
  transaction: 'Transaction Documents',
  property: 'Property Documents',
  income: 'Income Documents',
  net_worth: 'Net Worth Documents',
  existing_properties: 'Existing Properties',
};

const categoryOrder: Document['category'][] = [
  'transaction',
  'property',
  'income',
  'net_worth',
  'existing_properties',
];

type DocStatus = 'pending' | 'uploaded' | 'verified';

function getDocStatus(docId: string, uploads: IntakeUpload[]): DocStatus {
  const match = uploads.find(
    (u) => u.doc_id === docId && u.upload_status !== 'deleted',
  );
  if (!match) return 'pending';
  if (
    match.classification_status === 'accepted' ||
    match.extraction_status === 'accepted'
  )
    return 'verified';
  return 'uploaded';
}

function StatusPill({ status }: { status: DocStatus }) {
  const styles: Record<DocStatus, string> = {
    pending:
      'bg-slate-100 text-slate-600 border-slate-200',
    uploaded:
      'bg-amber-50 text-amber-700 border-amber-200',
    verified:
      'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const labels: Record<DocStatus, string> = {
    pending: 'Pending',
    uploaded: 'Uploaded',
    verified: 'Verified',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function IntakeSummary() {
  const { intakeId } = useParams<{ intakeId: string }>();
  const navigate = useNavigate();

  const [intake, setIntake] = useState<Intake | null>(null);
  const [uploads, setUploads] = useState<IntakeUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!intakeId) return;

    let cancelled = false;

    async function load() {
      try {
        const [intakeData, uploadsData] = await Promise.all([
          fetchIntake(intakeId!),
          fetchUploads(intakeId!),
        ]);
        if (!cancelled) {
          setIntake(intakeData);
          setUploads(uploadsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load intake',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [intakeId]);

  const requiredDocs = intake?.required_docs ?? [];

  const groupedDocs = useMemo(() => {
    const groups: Record<string, Document[]> = {};
    for (const doc of requiredDocs) {
      if (!groups[doc.category]) groups[doc.category] = [];
      groups[doc.category].push(doc);
    }
    return groups;
  }, [requiredDocs]);

  const uploadedCount = useMemo(() => {
    return requiredDocs.filter((doc) => {
      const status = getDocStatus(doc.id, uploads);
      return status === 'uploaded' || status === 'verified';
    }).length;
  }, [requiredDocs, uploads]);

  const allComplete = requiredDocs.length > 0 && uploadedCount === requiredDocs.length;
  const hasUploads = uploads.length > 0;
  const progress =
    requiredDocs.length > 0
      ? Math.round((uploadedCount / requiredDocs.length) * 100)
      : 0;

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
      const filename = generatePdfFilename(
        intake.client_first_name,
        intake.client_last_name,
      );
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

  const handleExportJson = () => {
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
      form_answers: intake.form_answers,
      engine_tags: intake.engine_tags,
      required_docs: intake.required_docs.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        status: getDocStatus(d.id, uploads),
      })),
      created_at: intake.created_at,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 animate-spin text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="mt-3 text-sm text-slate-500">Loading intake...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !intake) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-800">
            {error || 'Intake not found'}
          </p>
          <button
            onClick={() => navigate('/intake/new')}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Create a new intake
          </button>
        </div>
      </div>
    );
  }

  const createdDate = new Date(intake.created_at).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {intake.client_first_name} {intake.client_last_name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Broker: {intake.broker_name} &middot; Created {createdDate}
              </p>
            </div>
            <button
              onClick={() => navigate('/intake/new')}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 sm:mt-0"
            >
              + New Intake
            </button>
          </div>
        </div>

        {/* Completion banner */}
        {allComplete && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-emerald-800">
                Package ready for export
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Document Progress
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {uploadedCount} / {requiredDocs.length} uploaded
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                allComplete ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            onClick={() => navigate(`/intake/${intakeId}/uploads`)}
            className="flex-1 sm:flex-initial"
          >
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload Documents
            </span>
          </Button>
          <Button
            variant="secondary"
            onClick={handleGeneratePdf}
            loading={pdfLoading}
          >
            Generate PDF
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportJson}
            disabled={!hasUploads && !allComplete}
          >
            Export CRM JSON
          </Button>
        </div>

        {/* Document checklist */}
        <div className="space-y-6">
          {categoryOrder.map((category) => {
            const docs = groupedDocs[category];
            if (!docs || docs.length === 0) return null;

            return (
              <div
                key={category}
                className="rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {categoryLabels[category]}
                  </h3>
                </div>
                <ul className="divide-y divide-slate-100">
                  {docs.map((doc) => {
                    const status = getDocStatus(doc.id, uploads);
                    const upload = uploads.find(
                      (u) =>
                        u.doc_id === doc.id && u.upload_status !== 'deleted',
                    );

                    return (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {doc.name}
                          </p>
                          {doc.note && (
                            <p className="mt-0.5 text-xs text-slate-500 truncate">
                              {doc.note}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <StatusPill status={status} />
                          {upload ? (
                            <button
                              onClick={() =>
                                navigate(`/intake/${intakeId}/uploads`)
                              }
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                              View
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                navigate(`/intake/${intakeId}/uploads`)
                              }
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                              Upload
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
