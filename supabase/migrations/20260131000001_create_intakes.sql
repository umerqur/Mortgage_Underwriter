-- Enable UUID generation
create extension if not exists "pgcrypto";

create table intakes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Ownership
  created_by_user_id uuid not null default auth.uid(),

  -- Broker and client info
  broker_name text not null,
  client_first_name text not null,
  client_last_name text not null,
  client_email text,
  client_phone text,

  -- Intake data
  form_answers jsonb not null default '{}',
  engine_tags text[] not null default '{}',
  required_docs jsonb not null default '[]',

  -- Generated artifacts
  pdf_summary_path text
);

-- Ownership index
create index idx_intakes_created_by on intakes (created_by_user_id);

-- Optional FK to Supabase auth users
alter table intakes
add constraint intakes_created_by_fkey
foreign key (created_by_user_id)
references auth.users(id)
on delete cascade;

-- Auto update updated_at on change
create or replace function set_intakes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_set_intakes_updated_at
before update on intakes
for each row
execute function set_intakes_updated_at();

-- Enable RLS
alter table intakes enable row level security;

-- RLS policies
create policy "Users can view own intakes"
  on intakes
  for select
  using (auth.uid() = created_by_user_id);

create policy "Users can create own intakes"
  on intakes
  for insert
  with check (auth.uid() = created_by_user_id);

create policy "Users can update own intakes"
  on intakes
  for update
  using (auth.uid() = created_by_user_id)
  with check (auth.uid() = created_by_user_id);

create policy "Users can delete own intakes"
  on intakes
  for delete
  using (auth.uid() = created_by_user_id);
