-- Migration: Create private storage bucket and access policies
-- Path format: intakes/{intakeId}/{uploadId}/{originalFileName}
-- No public access — signed URLs only, scoped to intake owner
--
-- NOTE: INSERT INTO storage.buckets may fail if your Supabase project
-- does not allow bucket creation via SQL. In that case, create the
-- bucket manually in the Supabase Dashboard (see RUNBOOK.md).

-- Attempt bucket creation via SQL.
-- If this errors in your environment, remove these lines and use the dashboard.
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
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Helper: validates the storage path has ≥ 4 segments and starts with
-- "intakes", then confirms the intakeId belongs to the calling user.
--
-- Expected name column value: intakes/<intakeId>/<uploadId>/<fileName>
-- string_to_array splits on '/' → {intakes, <intakeId>, <uploadId>, <fileName>}
-- PostgreSQL arrays are 1-indexed.
-- ---------------------------------------------------------------------------

-- Storage RLS: only the intake owner can upload files into their intake path
create policy "Intake owner can upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'brokerops_uploads'
    and (string_to_array(name, '/'))[1] = 'intakes'
    and array_length(string_to_array(name, '/'), 1) >= 4
    and exists (
      select 1 from public.intakes
      where intakes.id = (string_to_array(name, '/'))[2]::uuid
        and intakes.created_by_user_id = auth.uid()
    )
  );

-- Storage RLS: only the intake owner can read their files
create policy "Intake owner can read files"
  on storage.objects for select
  using (
    bucket_id = 'brokerops_uploads'
    and (string_to_array(name, '/'))[1] = 'intakes'
    and array_length(string_to_array(name, '/'), 1) >= 4
    and exists (
      select 1 from public.intakes
      where intakes.id = (string_to_array(name, '/'))[2]::uuid
        and intakes.created_by_user_id = auth.uid()
    )
  );

-- Storage RLS: only the intake owner can delete their files
create policy "Intake owner can delete files"
  on storage.objects for delete
  using (
    bucket_id = 'brokerops_uploads'
    and (string_to_array(name, '/'))[1] = 'intakes'
    and array_length(string_to_array(name, '/'), 1) >= 4
    and exists (
      select 1 from public.intakes
      where intakes.id = (string_to_array(name, '/'))[2]::uuid
        and intakes.created_by_user_id = auth.uid()
    )
  );
