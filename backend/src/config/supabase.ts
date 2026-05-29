/**
 * Supabase client configuration for the backend.
 * Uses the service role key to bypass Row Level Security when needed.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceKey);
export const supabaseSetupError =
  'Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env.';

/**
 * Admin client — has full database access, bypasses RLS.
 * NEVER expose this on the frontend.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || 'http://127.0.0.1:54321',
  supabaseServiceKey || 'missing-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Creates a Supabase client that acts on behalf of the authenticated user.
 * Respects Row Level Security policies.
 */
export const createUserClient = (accessToken: string): SupabaseClient => {
  return createClient(supabaseUrl || 'http://127.0.0.1:54321', process.env.SUPABASE_ANON_KEY || supabaseServiceKey || 'missing-anon-key', {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
