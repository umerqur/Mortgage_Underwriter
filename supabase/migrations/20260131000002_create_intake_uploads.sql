-- Migration: Create intake_uploads table
-- Stores uploaded files linked to an intake, with classification and extraction status

create table intake_uploads (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz not null default now(),
  intake_id                 uuid not null references intakes (id) on delete cascade,
  doc_id                    text,
  file_path                 text not null,
  file_name                 text not null,
  mime_type                 text not null,
  size_bytes                bigint not null,
  sha256                    text,
  upload_status             text not null default 'uploaded'
    check (upload_status in ('uploaded', 'deleted')),
  classification_status     text not null default 'pending'
    check (classification_status in ('pending', 'classified', 'needs_review', 'accepted')),
  classified_doc_id         text,
  classification_confidence numeric,
  extraction_status         text not null default 'pending'
    check (extraction_status in ('pending', 'extracted', 'needs_review', 'accepted', 'failed')),
  extraction_confidence     numeric,
  extracted_json            jsonb,
  error_message             text
);

-- Index for fast lookup by intake
create index idx_intake_uploads_intake_id on intake_uploads (intake_id);

-- Enable RLS
alter table intake_uploads enable row level security;

-- Policy: uploads visible only if the parent intake belongs to the user
create policy "Users can view uploads for own intakes"
  on intake_uploads for select
  using (
    exists (
      select 1 from intakes
      where intakes.id = intake_uploads.intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  );

create policy "Users can insert uploads for own intakes"
  on intake_uploads for insert
  with check (
    exists (
      select 1 from intakes
      where intakes.id = intake_uploads.intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  );

create policy "Users can update uploads for own intakes"
  on intake_uploads for update
  using (
    exists (
      select 1 from intakes
      where intakes.id = intake_uploads.intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from intakes
      where intakes.id = intake_uploads.intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  );

create policy "Users can delete uploads for own intakes"
  on intake_uploads for delete
  using (
    exists (
      select 1 from intakes
      where intakes.id = intake_uploads.intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  );
