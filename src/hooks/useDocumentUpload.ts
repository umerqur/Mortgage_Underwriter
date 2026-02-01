import { useState, useRef, useCallback } from 'react';
import type { IntakeUpload } from '../lib/types';
import { uploadFile, deleteUpload, getSignedUrl } from '../lib/intakeService';

export interface UseDocumentUploadOptions {
  intakeId: string | undefined;
  uploads: IntakeUpload[];
  setUploads: React.Dispatch<React.SetStateAction<IntakeUpload[]>>;
}

export function useDocumentUpload({ intakeId, uploads, setUploads }: UseDocumentUploadOptions) {
  // Per-doc upload state
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  // Per-upload delete state
  const [deletingUploads, setDeletingUploads] = useState<Record<string, boolean>>({});

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewMimeType, setPreviewMimeType] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const handleUpload = useCallback(
    async (docId: string, file: File) => {
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
        const input = fileInputRefs.current[docId];
        if (input) input.value = '';
      }
    },
    [intakeId, setUploads],
  );

  const handleDelete = useCallback(
    async (upload: IntakeUpload) => {
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
    },
    [setUploads],
  );

  const handlePreview = useCallback(
    async (upload: IntakeUpload) => {
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
    },
    [intakeId],
  );

  const closePreview = useCallback(() => setPreviewOpen(false), []);

  const triggerFileInput = useCallback((docId: string) => {
    fileInputRefs.current[docId]?.click();
  }, []);

  const setFileInputRef = useCallback((docId: string, el: HTMLInputElement | null) => {
    fileInputRefs.current[docId] = el;
  }, []);

  return {
    uploadingDocs,
    uploadErrors,
    deletingUploads,
    uploadsByDoc,
    handleUpload,
    handleDelete,
    handlePreview,
    triggerFileInput,
    setFileInputRef,
    // Preview modal props
    previewOpen,
    closePreview,
    previewUrl,
    previewFileName,
    previewMimeType,
    previewLoading,
    previewError,
  };
}
