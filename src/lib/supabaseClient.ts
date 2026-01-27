import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that the anon key is in the correct format (JWT starting with eyJ)
// Keys starting with sb_publishable are Stripe keys, not Supabase keys
function validateSupabaseConfig(): string | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.';
  }

  if (supabaseAnonKey.startsWith('sb_publishable')) {
    return 'Invalid VITE_SUPABASE_ANON_KEY: You are using a Stripe publishable key instead of the Supabase anon public key. The Supabase anon key should start with "eyJ..." and can be found in Supabase Dashboard > Project Settings > API > anon public.';
  }

  if (!supabaseAnonKey.startsWith('eyJ')) {
    return 'Invalid VITE_SUPABASE_ANON_KEY: The Supabase anon public key should be a JWT starting with "eyJ...". Find it in Supabase Dashboard > Project Settings > API > anon public.';
  }

  return null;
}

export const supabaseConfigError = validateSupabaseConfig();

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const ALLOWED_EMAILS = [
  'umer.qureshi@gmail.com',
  'ousmaan_ahmed@icloud.com',
];

export function isEmailAllowed(email: string | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
