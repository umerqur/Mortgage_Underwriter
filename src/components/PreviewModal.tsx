import { useEffect, useRef } from 'react';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  url: string | null;
  fileName: string;
  mimeType: string;
  loading?: boolean;
  error?: string | null;
}

export default function PreviewModal({
  open,
  onClose,
  url,
  fileName,
  mimeType,
  loading = false,
  error = null,
}: PreviewModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {fileName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close preview"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                <span className="text-sm text-slate-500">Loading preview...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex h-64 items-center justify-center">
              <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-center">
                <p className="text-sm font-medium text-red-800">Preview failed</p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && url && isPdf && (
            <iframe
              src={url}
              title={fileName}
              className="h-[70vh] w-full rounded-lg border border-slate-200"
            />
          )}

          {!loading && !error && url && isImage && (
            <div className="flex items-center justify-center">
              <img
                src={url}
                alt={fileName}
                className="max-h-[70vh] rounded-lg object-contain"
              />
            </div>
          )}

          {!loading && !error && url && !isPdf && !isImage && (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <svg className="h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-slate-500">Preview not available for this file type.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
