-- Migration: Create private storage bucket for intake uploads
-- Path format: intakes/{intakeId}/{uploadId}/{originalFileName}
-- No public access — signed URLs only, scoped to intake owner

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brokerops_uploads',
  'brokerops_uploads',
  false,
  52428800, -- 50 MB max per file
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/tiff'
  ]
);

-- Storage RLS: only the intake owner can upload files into their intake path
create policy "Intake owner can upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'brokerops_uploads'
    and exists (
      select 1 from intakes
      where intakes.id = (string_to_array(name, '/'))[2]::uuid
        and intakes.created_by_user_id = auth.uid()
    )
  );

-- Storage RLS: only the intake owner can read their files
create policy "Intake owner can read files"
  on storage.objects for select
  using (
    bucket_id = 'brokerops_uploads'
    and exists (
      select 1 from intakes
      where intakes.id = (string_to_array(name, '/'))[2]::uuid
        and intakes.created_by_user_id = auth.uid()
    )
  );

-- Storage RLS: only the intake owner can delete their files
create policy "Intake owner can delete files"
  on storage.objects for delete
  using (
    bucket_id = 'brokerops_uploads'
    and exists (
      select 1 from intakes
      where intakes.id = (string_to_array(name, '/'))[2]::uuid
        and intakes.created_by_user_id = auth.uid()
    )
  );
