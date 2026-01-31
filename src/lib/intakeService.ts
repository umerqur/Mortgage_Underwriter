import { supabase } from './supabaseClient';
import type { FormAnswers, Document, Intake, IntakeUpload } from './types';

// ---------- Intakes ----------

export interface CreateIntakeParams {
  broker_name: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  client_phone: string;
  form_answers: FormAnswers;
  engine_tags: string[];
  required_docs: Document[];
}

export async function createIntake(params: CreateIntakeParams): Promise<Intake> {
  const { data, error } = await supabase
    .from('intakes')
    .insert(params)
    .select()
    .single();

  if (error) throw error;
  return data as Intake;
}

export async function getIntake(intakeId: string): Promise<Intake> {
  const { data, error } = await supabase
    .from('intakes')
    .select('*')
    .eq('id', intakeId)
    .single();

  if (error) throw error;
  return data as Intake;
}

export interface UpdateIntakeDetailsParams {
  broker_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  client_email?: string;
  client_phone?: string;
}

export async function updateIntakeDetails(
  intakeId: string,
  params: UpdateIntakeDetailsParams,
): Promise<Intake> {
  const { data, error } = await supabase
    .from('intakes')
    .update(params)
    .eq('id', intakeId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Intake;
}

// ---------- Uploads ----------

export async function getUploads(intakeId: string): Promise<IntakeUpload[]> {
  const { data, error } = await supabase
    .from('intake_uploads')
    .select('*')
    .eq('intake_id', intakeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as IntakeUpload[];
}

export async function getActiveUploads(intakeId: string): Promise<IntakeUpload[]> {
  const { data, error } = await supabase
    .from('intake_uploads')
    .select('*')
    .eq('intake_id', intakeId)
    .eq('upload_status', 'uploaded')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as IntakeUpload[];
}

export interface UploadFileParams {
  intakeId: string;
  docId: string;
  file: File;
}

export async function uploadFile({ intakeId, docId, file }: UploadFileParams): Promise<IntakeUpload> {
  const uploadId = crypto.randomUUID();
  const storagePath = `intakes/${intakeId}/${uploadId}/${file.name}`;

  // Upload to storage
  const { error: storageError } = await supabase.storage
    .from('brokerops_uploads')
    .upload(storagePath, file, { upsert: false });

  if (storageError) throw storageError;

  // Insert metadata row
  const { data, error } = await supabase
    .from('intake_uploads')
    .insert({
      id: uploadId,
      intake_id: intakeId,
      doc_id: docId,
      file_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select()
    .single();

  if (error) throw error;
  return data as IntakeUpload;
}

export async function deleteUpload(upload: IntakeUpload): Promise<void> {
  // Remove file from storage
  const { error: storageError } = await supabase.storage
    .from('brokerops_uploads')
    .remove([upload.file_path]);

  if (storageError) throw storageError;

  // Mark as deleted in metadata
  const { error } = await supabase
    .from('intake_uploads')
    .update({ upload_status: 'deleted' })
    .eq('id', upload.id);

  if (error) throw error;
}

// ---------- Signed URLs ----------

export async function getSignedUrl(intakeId: string, filePath: string): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intake-signed-url`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ intake_id: intakeId, file_path: filePath }),
    },
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as Record<string, string>).error ?? 'Failed to get signed URL');
  }

  const { signed_url } = (await response.json()) as { signed_url: string };
  return signed_url;
}
