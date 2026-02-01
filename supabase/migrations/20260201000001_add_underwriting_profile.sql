-- Add underwriting_profile JSONB column to intakes table.
-- This stores the canonical underwriting model per intake.
alter table intakes
  add column underwriting_profile jsonb default null;
