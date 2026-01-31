-- Migration: Create extracted_fields table
-- Stores individual structured fields extracted from uploaded documents

create table extracted_fields (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  intake_id         uuid not null references intakes (id) on delete cascade,
  source_upload_id  uuid not null references intake_uploads (id) on delete cascade,
  field_key         text not null,
  field_label       text not null,
  field_value       text not null,
  field_type        text not null,
  confidence        numeric not null,
  page_number       int,
  raw_snippet       text
);

-- Index for fast lookup by intake and by source upload
create index idx_extracted_fields_intake_id on extracted_fields (intake_id);
create index idx_extracted_fields_source_upload_id on extracted_fields (source_upload_id);

-- Enable RLS
alter table extracted_fields enable row level security;

-- Policy: extracted fields visible only if the parent intake belongs to the user
create policy "Users can view extracted fields for own intakes"
  on extracted_fields for select
  using (
    exists (
      select 1 from intakes
      where intakes.id = extracted_fields.intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  );

create policy "Users can insert extracted fields for own intakes"
  on extracted_fields for insert
  with check (
    exists (
      select 1 from intakes
      where intakes.id = intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  );

create policy "Users can update extracted fields for own intakes"
  on extracted_fields for update
  using (
    exists (
      select 1 from intakes
      where intakes.id = extracted_fields.intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from intakes
      where intakes.id = extracted_fields.intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  );

create policy "Users can delete extracted fields for own intakes"
  on extracted_fields for delete
  using (
    exists (
      select 1 from intakes
      where intakes.id = extracted_fields.intake_id
        and intakes.created_by_user_id = auth.uid()
    )
  );
