import { supabase } from './supabaseClient';
import type { FormAnswers, Document, Intake, IntakeUpload } from './types';

// ---------------------------------------------------------------------------
// Intake CRUD
// ---------------------------------------------------------------------------

export async function createIntake(
  formAnswers: FormAnswers,
  engineTags: string[],
  requiredDocs: Document[],
): Promise<Intake> {
  const { data, error } = await supabase
    .from('intakes')
    .insert({
      broker_name: formAnswers.brokerName,
      client_first_name: formAnswers.clientFirstName,
      client_last_name: formAnswers.clientLastName,
      client_email: formAnswers.clientEmail || null,
      client_phone: formAnswers.clientPhone || null,
      form_answers: formAnswers,
      engine_tags: engineTags,
      required_docs: requiredDocs,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Intake;
}

export async function fetchIntake(intakeId: string): Promise<Intake> {
  const { data, error } = await supabase
    .from('intakes')
    .select('*')
    .eq('id', intakeId)
    .single();

  if (error) throw error;
  return data as Intake;
}

// ---------------------------------------------------------------------------
// Uploads CRUD
// ---------------------------------------------------------------------------

export async function fetchUploads(intakeId: string): Promise<IntakeUpload[]> {
  const { data, error } = await supabase
    .from('intake_uploads')
    .select('*')
    .eq('intake_id', intakeId)
    .neq('upload_status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as IntakeUpload[];
}

interface UploadFileParams {
  intakeId: string;
  file: File;
  docId: string | null;
}

export async function uploadFile({
  intakeId,
  file,
  docId,
}: UploadFileParams): Promise<IntakeUpload> {
  const uploadId = crypto.randomUUID();
  const filePath = `intakes/${intakeId}/${uploadId}/${file.name}`;

  // 1. Upload to storage
  const { error: storageError } = await supabase.storage
    .from('brokerops_uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (storageError) throw storageError;

  // 2. Insert upload row
  const { data, error: dbError } = await supabase
    .from('intake_uploads')
    .insert({
      id: uploadId,
      intake_id: intakeId,
      doc_id: docId,
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      upload_status: 'uploaded',
    })
    .select()
    .single();

  if (dbError) throw dbError;
  return data as IntakeUpload;
}

export async function deleteUpload(upload: IntakeUpload): Promise<void> {
  // 1. Remove from storage
  const { error: storageError } = await supabase.storage
    .from('brokerops_uploads')
    .remove([upload.file_path]);

  if (storageError) throw storageError;

  // 2. Mark as deleted
  const { error: dbError } = await supabase
    .from('intake_uploads')
    .update({ upload_status: 'deleted' })
    .eq('id', upload.id);

  if (dbError) throw dbError;
}

export async function replaceUpload(
  existing: IntakeUpload,
  newFile: File,
): Promise<IntakeUpload> {
  await deleteUpload(existing);
  return uploadFile({
    intakeId: existing.intake_id,
    file: newFile,
    docId: existing.doc_id,
  });
}

// ---------------------------------------------------------------------------
// Signed URL (via edge function)
// ---------------------------------------------------------------------------

export async function getSignedUrl(
  intakeId: string,
  filePath: string,
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) throw new Error('Not authenticated');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intake-signed-url`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ intake_id: intakeId, file_path: filePath }),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).error || 'Failed to get signed URL');
  }

  const { signed_url } = (await res.json()) as { signed_url: string };
  return signed_url;
}
