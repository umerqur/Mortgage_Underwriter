import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Validate key format: legacy JWT (eyJ…) or new publishable key (sb_publishable_…)
const isLegacyJwt = supabaseAnonKey.startsWith('eyJ');
const isPublishableKey = supabaseAnonKey.startsWith('sb_publishable_');

if (!isLegacyJwt && !isPublishableKey) {
  throw new Error(
    'Invalid VITE_SUPABASE_ANON_KEY format. Expected legacy JWT (eyJ…) or publishable key (sb_publishable_…). Check Supabase Dashboard > Project Settings > API Keys.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ALLOWED_EMAILS = [
  'umer.qureshi@gmail.com',
  'ousmaan_ahmed@icloud.com',
];

export function isEmailAllowed(email: string | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase());
}
