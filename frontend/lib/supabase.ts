/**
 * Supabase client for the frontend.
 * Uses @supabase/ssr for Next.js App Router compatibility.
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseSetupError =
  'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to frontend/.env.local.';

/**
 * Browser-side Supabase client.
 * Use this in client components ('use client').
 */
export function createClient() {
  return createBrowserClient(
    supabaseUrl || 'http://127.0.0.1:54321',
    supabaseAnonKey || 'missing-anon-key'
  );
}

// Singleton for convenience
export const supabase = createClient();
