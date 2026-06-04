import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  const env = import.meta.env;
  if (env && env[key]) return String(env[key]).trim();
  
  // Fallback for non-Vite environments or specific build tool behavior
  try {
    const v = typeof process !== 'undefined' ? (process.env as any)[key] : '';
    if (v && v !== 'null' && v !== 'undefined') return String(v).trim();
  } catch (e) {
    // Ignore process errors
  }
  
  return '';
};

const rawUrl = getEnv('VITE_SUPABASE_URL');
const rawKey = getEnv('VITE_SUPABASE_ANON_KEY');

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjYwMDAwMDAwMH0.signature';

// 1. Sanitize URL
let supabaseUrl = PLACEHOLDER_URL;
if (rawUrl && rawUrl.trim() !== '' && rawUrl !== PLACEHOLDER_URL) {
  let cleanedUrl = rawUrl.trim();
  if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
    cleanedUrl = 'https://' + cleanedUrl;
  }
  try {
    const urlObj = new URL(cleanedUrl);
    supabaseUrl = urlObj.origin;
  } catch (e) {
    // Robust fallback regex/split split
    try {
      const base = cleanedUrl.split(/[?#]/)[0] || '';
      const clean = base.split('/rest/v1')[0].split('/auth/v1')[0];
      supabaseUrl = clean.replace(/\/$/, '');
    } catch (err) {
      console.error('Supabase URL split failed:', err);
      supabaseUrl = cleanedUrl.replace(/\/$/, '');
    }
  }
}

// 2. Key Validation helper
const isValidAnonKey = (key: string) => {
  return key && key.trim().length > 40; // Supabase keys are long strings (JWTs)
};

const supabaseAnonKey = (rawKey && rawKey.trim() !== '') ? rawKey.trim() : PLACEHOLDER_KEY;

// 3. Diagnostics
export const getSupabaseConfigError = (): string | null => {
  if (!rawUrl || rawUrl === PLACEHOLDER_URL || rawUrl.trim().length < 10) {
    return 'VITE_SUPABASE_URL is missing or blank. Please set it in your environment/settings.';
  }
  if (!rawKey || rawKey === PLACEHOLDER_KEY || rawKey.trim().length < 10) {
    return 'VITE_SUPABASE_ANON_KEY is missing or blank. Please set it in your environment/settings.';
  }
  if (rawKey.startsWith('http')) {
    return 'Configuration Error: You pasted the URL into the Secret Key field. Please swap them.';
  }
  if (!isValidAnonKey(rawKey)) {
    return 'The Anon Key provided is invalid (too short or missing "eyJ..."). Ensure you copied the public/anon key.';
  }
  return null;
};

export const isSupabaseConfigured = getSupabaseConfigError() === null;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
