-- Migration: Create intakes table
-- Stores intake sessions created by brokers

create extension if not exists "pgcrypto";

create table intakes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  created_by_user_id uuid not null,
  broker_name       text not null,
  client_first_name text not null,
  client_last_name  text not null,
  client_email      text not null,
  client_phone      text not null,
  form_answers      jsonb not null default '{}',
  engine_tags       text[] not null default '{}',
  required_docs     jsonb not null default '[]',
  pdf_summary_path  text
);

-- Index for fast lookup by owner
create index idx_intakes_created_by on intakes (created_by_user_id);

-- Enable RLS
alter table intakes enable row level security;

-- Policy: users can only SELECT their own intakes
create policy "Users can view own intakes"
  on intakes for select
  using (auth.uid() = created_by_user_id);

-- Policy: users can INSERT intakes they own
create policy "Users can create own intakes"
  on intakes for insert
  with check (auth.uid() = created_by_user_id);

-- Policy: users can UPDATE their own intakes
create policy "Users can update own intakes"
  on intakes for update
  using (auth.uid() = created_by_user_id)
  with check (auth.uid() = created_by_user_id);

-- Policy: users can DELETE their own intakes
create policy "Users can delete own intakes"
  on intakes for delete
  using (auth.uid() = created_by_user_id);
