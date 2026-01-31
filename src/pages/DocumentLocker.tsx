import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Intake, IntakeUpload, Document } from '../lib/types';
import { getIntake, getActiveUploads, uploadFile, deleteUpload, getSignedUrl } from '../lib/intakeService';
import PreviewModal from '../components/PreviewModal';

export default function DocumentLocker() {
  const { intakeId } = useParams<{ intakeId: string }>();

  const [intake, setIntake] = useState<Intake | null>(null);
  const [uploads, setUploads] = useState<IntakeUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-doc upload state: docId -> { uploading, error }
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  // Per-upload delete state
  const [deletingUploads, setDeletingUploads] = useState<Record<string, boolean>>({});

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewMimeType, setPreviewMimeType] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
      const message = err instanceof Error ? err.message : 'Failed to load documents';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [intakeId]);

  useEffect(() => {
    load();
  }, [load]);

  // Map of doc_id -> uploads for that doc
  const uploadsByDoc = uploads.reduce(
    (acc, u) => {
      const key = u.doc_id ?? '_unlinked';
      if (!acc[key]) acc[key] = [];
      acc[key].push(u);
      return acc;
    },
    {} as Record<string, IntakeUpload[]>,
  );

  const handleUpload = async (docId: string, file: File) => {
    if (!intakeId) return;
    setUploadingDocs((prev) => ({ ...prev, [docId]: true }));
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });

    try {
      const newUpload = await uploadFile({ intakeId, docId, file });
      setUploads((prev) => [newUpload, ...prev]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadErrors((prev) => ({ ...prev, [docId]: message }));
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docId]: false }));
      // Reset file input
      const input = fileInputRefs.current[docId];
      if (input) input.value = '';
    }
  };

  const handleDelete = async (upload: IntakeUpload) => {
    if (!confirm(`Delete "${upload.file_name}"? This cannot be undone.`)) return;
    setDeletingUploads((prev) => ({ ...prev, [upload.id]: true }));
    try {
      await deleteUpload(upload);
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingUploads((prev) => ({ ...prev, [upload.id]: false }));
    }
  };

  const handlePreview = async (upload: IntakeUpload) => {
    if (!intakeId) return;
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewUrl(null);
    setPreviewFileName(upload.file_name);
    setPreviewMimeType(upload.mime_type);

    try {
      const url = await getSignedUrl(intakeId, upload.file_path);
      setPreviewUrl(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load preview';
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            <p className="text-sm text-slate-500">Loading document locker...</p>
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
            <h2 className="mt-4 text-lg font-semibold text-red-900">Could not load documents</h2>
            <p className="mt-2 text-sm text-red-700">{error ?? 'Intake not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const requiredDocs: Document[] = intake.required_docs ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to={`/intake/${intakeId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Summary
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Document Locker
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Upload documents for{' '}
            <span className="font-medium text-slate-800">
              {intake.client_first_name} {intake.client_last_name}
            </span>
          </p>
        </div>

        {/* Document cards */}
        {requiredDocs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-4 text-sm text-slate-500">No documents required for this intake.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requiredDocs.map((doc) => {
              const docUploads = uploadsByDoc[doc.id] ?? [];
              const isUploading = uploadingDocs[doc.id] ?? false;
              const uploadError = uploadErrors[doc.id];
              const hasUploads = docUploads.length > 0;

              return (
                <div
                  key={doc.id}
                  className={`rounded-xl border bg-white shadow-sm transition-colors ${
                    hasUploads ? 'border-green-200' : 'border-slate-200'
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{doc.name}</h3>
                        {hasUploads ? (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                            Uploaded
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                            Missing
                          </span>
                        )}
                      </div>
                      {doc.note && (
                        <p className="mt-0.5 text-xs text-slate-500">{doc.note}</p>
                      )}
                    </div>

                    {/* Upload button */}
                    <div className="ml-4 shrink-0">
                      <input
                        ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(doc.id, file);
                        }}
                      />
                      <button
                        onClick={() => fileInputRefs.current[doc.id]?.click()}
                        disabled={isUploading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
                    <div className="mx-6 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
                      <p className="text-xs text-red-700">{uploadError}</p>
                    </div>
                  )}

                  {/* Existing uploads for this doc */}
                  {docUploads.length > 0 && (
                    <div className="border-t border-slate-100 px-6 py-3">
                      <ul className="space-y-2">
                        {docUploads.map((upload) => {
                          const isDeleting = deletingUploads[upload.id] ?? false;
                          return (
                            <li
                              key={upload.id}
                              className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-2.5"
                            >
                              {/* File icon */}
                              <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-700">
                                  {upload.file_name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {formatBytes(upload.size_bytes)}
                                  <span className="mx-1.5">&middot;</span>
                                  {new Date(upload.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {/* Actions */}
                              <div className="flex shrink-0 gap-1">
                                <button
                                  onClick={() => handlePreview(upload)}
                                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                                  title="Preview"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(upload)}
                                  disabled={isDeleting}
                                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  title="Delete"
                                >
                                  {isDeleting ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        url={previewUrl}
        fileName={previewFileName}
        mimeType={previewMimeType}
        loading={previewLoading}
        error={previewError}
      />
    </div>
  );
}
