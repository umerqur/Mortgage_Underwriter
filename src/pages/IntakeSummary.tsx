import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Intake, IntakeUpload, Document } from '../lib/types';
import type { DocumentExtractionResult } from '../lib/underwritingProfile';
import { getIntake, getActiveUploads, extractKeyInfo } from '../lib/intakeService';
import { toVelocityDeal } from '../lib/velocityAdapter';
import {
  buildPdfBlob,
  generatePdfFilename,
  formatReportDate,
} from '../lib/pdfReport';
import EditIntakeModal from '../components/EditIntakeModal';
import PreviewModal from '../components/PreviewModal';
import { useDocumentUpload } from '../hooks/useDocumentUpload';

const categoryOrder = ['transaction', 'property', 'income', 'net_worth', 'existing_properties'] as const;

const categoryLabels: Record<string, string> = {
  transaction: 'Transaction Documents',
  property: 'Property Documents',
  income: 'Income Documents',
  net_worth: 'Net Worth Documents',
  existing_properties: 'Existing Properties',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function IntakeSummary() {
  const { intakeId } = useParams<{ intakeId: string }>();
  const navigate = useNavigate();

  const [intake, setIntake] = useState<Intake | null>(null);
  const [uploads, setUploads] = useState<IntakeUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [extractingUploads, setExtractingUploads] = useState<Record<string, boolean>>({});
  const [extractionErrors, setExtractionErrors] = useState<Record<string, string>>({});

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

  const {
    uploadingDocs,
    uploadErrors,
    deletingUploads,
    uploadsByDoc,
    handleUpload,
    handleDelete,
    handlePreview,
    triggerFileInput,
    setFileInputRef,
    previewOpen,
    closePreview,
    previewUrl,
    previewFileName,
    previewMimeType,
    previewLoading,
    previewError,
  } = useDocumentUpload({ intakeId, uploads, setUploads });

  // Extraction handler
  const handleExtract = useCallback(
    async (uploadId: string) => {
      if (!intakeId) return;
      setExtractingUploads((prev) => ({ ...prev, [uploadId]: true }));
      setExtractionErrors((prev) => {
        const next = { ...prev };
        delete next[uploadId];
        return next;
      });

      try {
        const result = await extractKeyInfo(intakeId, uploadId);
        // Update canonical profile on the intake
        setIntake((prev) =>
          prev ? { ...prev, underwriting_profile: result.underwriting_profile } : prev,
        );
        // Store extraction result on the upload's extracted_json so the
        // per-document display reads from the upload row, not the profile.
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? { ...u, extracted_json: result.extraction, extraction_status: 'extracted' as const }
              : u,
          ),
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Extraction failed';
        setExtractionErrors((prev) => ({ ...prev, [uploadId]: message }));
      } finally {
        setExtractingUploads((prev) => ({ ...prev, [uploadId]: false }));
      }
    },
    [intakeId],
  );

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
  const uploadedDocIds = new Set(
    uploads.map((u) => u.doc_id).filter((id): id is string => id != null),
  );

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
    const payload = toVelocityDeal(intake, uploadedDocIds);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `velocity-deal-${intake.id.slice(0, 8)}.json`;
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
          to="/intakes"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Intakes
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
            <div className="mt-2 flex items-center gap-2 sm:mt-0">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                {totalDocs} documents required
              </span>
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
            </div>
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

        {/* Underwriting Summary — read-only, rendered from canonical profile */}
        {intake.underwriting_profile?.income?.employment && (() => {
          const emp = intake.underwriting_profile!.income.employment!;
          const hasValues = emp.annualIncome != null || emp.netIncome != null || emp.taxableIncome != null;
          if (!hasValues) return null;
          return (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">Underwriting Summary</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {emp.annualIncome != null && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Annual Income</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(emp.annualIncome)}</p>
                    </div>
                  )}
                  {emp.netIncome != null && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Net Income</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(emp.netIncome)}</p>
                    </div>
                  )}
                  {emp.taxableIncome != null && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Taxable Income</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(emp.taxableIncome)}</p>
                    </div>
                  )}
                </div>
                {emp.sourceDocuments.length > 0 && (
                  <p className="mt-3 text-xs text-slate-400">
                    Source: {emp.sourceDocuments.join(', ')}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Action bar */}
        <div className="mt-6 flex flex-wrap gap-3">
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
                    const docUploads = uploadsByDoc[doc.id] ?? [];
                    const hasUpload = docUploads.length > 0;
                    const isUploading = uploadingDocs[doc.id] ?? false;
                    const uploadError = uploadErrors[doc.id];

                    return (
                      <li key={doc.id} className="px-6 py-3.5">
                        <div className="flex items-center gap-4">
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

                          {/* Upload button (always available) */}
                          <div className="shrink-0">
                            <input
                              ref={(el) => { setFileInputRef(doc.id, el); }}
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(doc.id, file);
                              }}
                            />
                            <button
                              onClick={() => triggerFileInput(doc.id)}
                              disabled={isUploading}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isUploading ? (
                                <>
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  Upload
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Upload error */}
                        {uploadError && (
                          <div className="ml-10 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <p className="text-xs text-red-700">{uploadError}</p>
                          </div>
                        )}

                        {/* Uploaded file chips */}
                        {docUploads.length > 0 && (
                          <div className="ml-10 mt-2 space-y-2">
                            {docUploads.map((upload) => {
                              const isDeleting = deletingUploads[upload.id] ?? false;
                              const isExtracting = extractingUploads[upload.id] ?? false;
                              const extractError = extractionErrors[upload.id];
                              const extraction = upload.extracted_json as DocumentExtractionResult | null;

                              return (
                                <div key={upload.id}>
                                  <div className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 mr-2">
                                    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-xs font-medium text-slate-700 max-w-[200px] truncate">
                                      {upload.file_name}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {formatBytes(upload.size_bytes)}
                                    </span>
                                    {/* Preview button */}
                                    <button
                                      onClick={() => handlePreview(upload)}
                                      className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                                      title="Preview"
                                    >
                                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    {/* Delete button */}
                                    <button
                                      onClick={() => handleDelete(upload)}
                                      disabled={isDeleting}
                                      className="rounded p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                      title="Delete"
                                    >
                                      {isDeleting ? (
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                      ) : (
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      )}
                                    </button>
                                    {/* Extract Key Info button */}
                                    <button
                                      onClick={() => handleExtract(upload.id)}
                                      disabled={isExtracting}
                                      className="ml-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                      title="Extract underwriting data from this document"
                                    >
                                      {isExtracting ? (
                                        <>
                                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
                                          Extracting...
                                        </>
                                      ) : (
                                        <>
                                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                          </svg>
                                          Extract Key Info
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Extraction error */}
                                  {extractError && (
                                    <div className="mt-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                                      <p className="text-xs text-red-700">{extractError}</p>
                                    </div>
                                  )}

                                  {/* Extracted values display */}
                                  {extraction && (
                                    <div className="mt-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                                      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                                        {extraction.totalIncome != null && (
                                          <>
                                            <span className="text-xs text-slate-500">Total income</span>
                                            <span className="text-xs font-semibold text-slate-800">{formatCurrency(extraction.totalIncome)}</span>
                                          </>
                                        )}
                                        {extraction.netIncome != null && (
                                          <>
                                            <span className="text-xs text-slate-500">Net income</span>
                                            <span className="text-xs font-semibold text-slate-800">{formatCurrency(extraction.netIncome)}</span>
                                          </>
                                        )}
                                        {extraction.taxableIncome != null && (
                                          <>
                                            <span className="text-xs text-slate-500">Taxable income</span>
                                            <span className="text-xs font-semibold text-slate-800">{formatCurrency(extraction.taxableIncome)}</span>
                                          </>
                                        )}
                                        {extraction.taxpayerName != null && (
                                          <>
                                            <span className="text-xs text-slate-500">Taxpayer</span>
                                            <span className="text-xs font-semibold text-slate-800">{extraction.taxpayerName}</span>
                                          </>
                                        )}
                                      </div>
                                      <p className="mt-2 text-xs text-slate-400">
                                        Source: {extraction.documentLabel}
                                        {extraction.taxYear ? ` (${extraction.taxYear})` : ''}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
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

        {/* Edit intake details modal */}
        <EditIntakeModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          intake={intake}
          onSaved={(updated) => setIntake(updated)}
        />

        {/* Preview modal */}
        <PreviewModal
          open={previewOpen}
          onClose={closePreview}
          url={previewUrl}
          fileName={previewFileName}
          mimeType={previewMimeType}
          loading={previewLoading}
          error={previewError}
        />
      </div>
    </div>
  );
}
