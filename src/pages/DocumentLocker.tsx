import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Intake, IntakeUpload, Document } from '../lib/types';
import {
  fetchIntake,
  fetchUploads,
  uploadFile,
  deleteUpload,
} from '../lib/intakeService';
import PreviewModal from '../components/PreviewModal';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const categoryLabels: Record<Document['category'], string> = {
  transaction: 'Transaction',
  property: 'Property',
  income: 'Income',
  net_worth: 'Net Worth',
  existing_properties: 'Existing Properties',
};

const categoryOrder: Document['category'][] = [
  'transaction',
  'property',
  'income',
  'net_worth',
  'existing_properties',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Try to match a filename to a doc requirement by substring matching */
function matchFilenameToDoc(
  fileName: string,
  docs: Document[],
  existingUploads: IntakeUpload[],
): Document | null {
  const lower = fileName.toLowerCase().replace(/[_\-\.]/g, ' ');

  // Docs that already have an upload are lower priority
  const uploadedDocIds = new Set(
    existingUploads
      .filter((u) => u.upload_status !== 'deleted')
      .map((u) => u.doc_id),
  );

  // Prioritize unmatched docs
  const sorted = [...docs].sort((a, b) => {
    const aHas = uploadedDocIds.has(a.id) ? 1 : 0;
    const bHas = uploadedDocIds.has(b.id) ? 1 : 0;
    return aHas - bHas;
  });

  for (const doc of sorted) {
    const docNameLower = doc.name.toLowerCase().replace(/[_\-\.()]/g, ' ');
    const words = docNameLower.split(/\s+/).filter((w) => w.length > 2);
    const matchCount = words.filter((w) => lower.includes(w)).length;
    if (matchCount >= 2 || (words.length <= 2 && matchCount >= 1)) {
      return doc;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DocumentLocker() {
  const { intakeId } = useParams<{ intakeId: string }>();
  const navigate = useNavigate();

  const [intake, setIntake] = useState<Intake | null>(null);
  const [uploads, setUploads] = useState<IntakeUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Document['category'] | 'all'>('all');
  const [uploadingDocIds, setUploadingDocIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [bulkUploading, setBulkUploading] = useState(false);
  const [preview, setPreview] = useState<IntakeUpload | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const bulkInputRef = useRef<HTMLInputElement | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    if (!intakeId) return;
    try {
      const [intakeData, uploadsData] = await Promise.all([
        fetchIntake(intakeId),
        fetchUploads(intakeId),
      ]);
      setIntake(intakeData);
      setUploads(uploadsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [intakeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const requiredDocs = intake?.required_docs ?? [];

  // Group docs by category
  const groupedDocs = useMemo(() => {
    const groups: Record<string, Document[]> = {};
    for (const doc of requiredDocs) {
      if (!groups[doc.category]) groups[doc.category] = [];
      groups[doc.category].push(doc);
    }
    return groups;
  }, [requiredDocs]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; uploaded: number }> = {};
    for (const doc of requiredDocs) {
      if (!counts[doc.category]) counts[doc.category] = { total: 0, uploaded: 0 };
      counts[doc.category].total++;
      const hasUpload = uploads.some(
        (u) => u.doc_id === doc.id && u.upload_status !== 'deleted',
      );
      if (hasUpload) counts[doc.category].uploaded++;
    }
    return counts;
  }, [requiredDocs, uploads]);

  // Visible docs
  const visibleDocs = useMemo(() => {
    if (activeCategory === 'all') return requiredDocs;
    return requiredDocs.filter((d) => d.category === activeCategory);
  }, [requiredDocs, activeCategory]);

  const totalUploaded = useMemo(
    () =>
      requiredDocs.filter((doc) =>
        uploads.some(
          (u) => u.doc_id === doc.id && u.upload_status !== 'deleted',
        ),
      ).length,
    [requiredDocs, uploads],
  );

  // Upload handler for a single doc
  const handleUpload = useCallback(
    async (docId: string, file: File) => {
      if (!intakeId) return;
      setUploadingDocIds((prev) => new Set(prev).add(docId));
      setActionError(null);
      try {
        // If there's an existing upload for this doc, delete it first
        const existing = uploads.find(
          (u) => u.doc_id === docId && u.upload_status !== 'deleted',
        );
        if (existing) {
          await deleteUpload(existing);
        }
        await uploadFile({ intakeId, file, docId });
        // Refresh uploads
        const freshUploads = await fetchUploads(intakeId);
        setUploads(freshUploads);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Upload failed',
        );
      } finally {
        setUploadingDocIds((prev) => {
          const next = new Set(prev);
          next.delete(docId);
          return next;
        });
      }
    },
    [intakeId, uploads],
  );

  // Delete handler
  const handleDelete = useCallback(
    async (upload: IntakeUpload) => {
      if (!intakeId) return;
      setDeletingIds((prev) => new Set(prev).add(upload.id));
      setActionError(null);
      try {
        await deleteUpload(upload);
        const freshUploads = await fetchUploads(intakeId);
        setUploads(freshUploads);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Delete failed',
        );
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(upload.id);
          return next;
        });
      }
    },
    [intakeId],
  );

  // Bulk upload handler
  const handleBulkUpload = useCallback(
    async (files: FileList) => {
      if (!intakeId || files.length === 0) return;
      setBulkUploading(true);
      setActionError(null);

      try {
        for (const file of Array.from(files)) {
          const matchedDoc = matchFilenameToDoc(
            file.name,
            requiredDocs,
            uploads,
          );
          const docId = matchedDoc?.id ?? null;
          await uploadFile({ intakeId, file, docId });
        }
        const freshUploads = await fetchUploads(intakeId);
        setUploads(freshUploads);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : 'Bulk upload failed',
        );
      } finally {
        setBulkUploading(false);
      }
    },
    [intakeId, requiredDocs, uploads],
  );

  // Drag and drop handlers
  const [dragActive, setDragActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleBulkUpload(e.dataTransfer.files);
    }
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
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-slate-500">Loading documents...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !intake) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-800">{error || 'Intake not found'}</p>
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

  const progress =
    requiredDocs.length > 0
      ? Math.round((totalUploaded / requiredDocs.length) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate(`/intake/${intakeId}`)}
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to Summary
            </button>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Document Locker
            </h1>
            <p className="text-sm text-slate-500">
              {intake.client_first_name} {intake.client_last_name} &middot;{' '}
              {totalUploaded} / {requiredDocs.length} uploaded
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Progress mini bar */}
            <div className="hidden w-40 sm:block">
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-600">{progress}%</span>
          </div>
        </div>

        {/* Action error */}
        {actionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left nav */}
          <nav className="w-full shrink-0 lg:w-56">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sections
                </h3>
              </div>
              <ul className="p-2">
                <li>
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeCategory === 'all'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      All Documents
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {totalUploaded}/{requiredDocs.length}
                      </span>
                    </span>
                  </button>
                </li>
                {categoryOrder.map((cat) => {
                  const counts = categoryCounts[cat];
                  if (!counts) return null;
                  return (
                    <li key={cat}>
                      <button
                        onClick={() => setActiveCategory(cat)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                          activeCategory === cat
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          {categoryLabels[cat]}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {counts.uploaded}/{counts.total}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Bulk upload drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => bulkInputRef.current?.click()}
              className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={bulkInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleBulkUpload(e.target.files);
                  e.target.value = '';
                }}
              />
              {bulkUploading ? (
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm font-medium text-indigo-600">Uploading files...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="h-8 w-8 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Drop files here or click to bulk upload
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Files will be auto-matched to checklist items by filename
                  </p>
                </>
              )}
            </div>

            {/* Document cards */}
            <div className="space-y-4">
              {visibleDocs.map((doc) => {
                const upload = uploads.find(
                  (u) => u.doc_id === doc.id && u.upload_status !== 'deleted',
                );
                const isUploading = uploadingDocIds.has(doc.id);
                const isDeleting = upload ? deletingIds.has(upload.id) : false;

                return (
                  <div
                    key={doc.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left: doc info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {doc.name}
                          </p>
                          {upload && (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Uploaded
                            </span>
                          )}
                          {!upload && (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              Pending
                            </span>
                          )}
                        </div>
                        {doc.note && (
                          <p className="mt-1 text-xs text-slate-500">
                            {doc.note}
                          </p>
                        )}
                        {upload && (
                          <p className="mt-1 text-xs text-slate-400">
                            {upload.file_name} &middot;{' '}
                            {formatFileSize(upload.size_bytes)}
                          </p>
                        )}
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {upload && (
                          <>
                            <button
                              onClick={() => setPreview(upload)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleDelete(upload)}
                              disabled={isDeleting}
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100 disabled:cursor-not-allowed disabled:text-red-300"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}

                        {/* Upload / Replace button */}
                        <button
                          onClick={() => fileInputRefs.current[doc.id]?.click()}
                          disabled={isUploading}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-indigo-400"
                        >
                          {isUploading ? (
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Uploading...
                            </span>
                          ) : upload ? (
                            'Replace'
                          ) : (
                            'Upload'
                          )}
                        </button>
                        <input
                          ref={(el) => {
                            fileInputRefs.current[doc.id] = el;
                          }}
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(doc.id, file);
                            e.target.value = '';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleDocs.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-sm text-slate-500">
                  No documents in this category.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {preview && intakeId && (
        <PreviewModal
          intakeId={intakeId}
          filePath={preview.file_path}
          fileName={preview.file_name}
          mimeType={preview.mime_type}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
