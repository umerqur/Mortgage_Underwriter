import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that the anon key is in a valid format:
// - Legacy JWT format starting with "eyJ"
// - New publishable key format starting with "sb_publishable_"
function validateSupabaseConfig(): string | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.';
  }

  const isLegacyJwt = supabaseAnonKey.startsWith('eyJ');
  const isPublishableKey = supabaseAnonKey.startsWith('sb_publishable_');

  if (!isLegacyJwt && !isPublishableKey) {
    return 'Invalid Supabase public key. Use either the legacy anon key starting with "eyJ" or the publishable key starting with "sb_publishable_". Check Supabase Dashboard > Project Settings > API Keys.';
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
  if (!email) return false
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase())
}
