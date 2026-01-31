import { useState, useEffect } from 'react';
import { getSignedUrl } from '../lib/intakeService';

interface PreviewModalProps {
  intakeId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  onClose: () => void;
}

export default function PreviewModal({
  intakeId,
  filePath,
  fileName,
  mimeType,
  onClose,
}: PreviewModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const signedUrl = await getSignedUrl(intakeId, filePath);
        if (!cancelled) setUrl(signedUrl);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load preview',
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
  }, [intakeId, filePath]);

  // Close on escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {fileName}
          </h3>
          <div className="flex items-center gap-3">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Open in new tab
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <svg
                className="h-8 w-8 animate-spin text-indigo-600"
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
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700">{error}</p>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Try opening in a new tab
                </a>
              )}
            </div>
          )}

          {!loading && !error && url && (
            <>
              {isPdf && (
                <iframe
                  src={url}
                  title={fileName}
                  className="h-[70vh] w-full rounded-lg border border-slate-200"
                />
              )}
              {isImage && (
                <div className="flex items-center justify-center">
                  <img
                    src={url}
                    alt={fileName}
                    className="max-h-[70vh] rounded-lg object-contain"
                  />
                </div>
              )}
              {!isPdf && !isImage && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                  <p className="text-sm text-slate-600">
                    Preview not available for this file type.
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Open in new tab
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
