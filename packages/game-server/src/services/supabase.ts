// Chaos Creatures Game Server — Supabase Client Service
// Service role client for server-side operations (bypasses RLS)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize the Supabase client with service role key.
 * Must be called before any database operations.
 */
export function initSupabase(url: string, serviceRoleKey: string): SupabaseClient {
  supabaseClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return supabaseClient;
}

/**
 * Get the initialized Supabase client.
 * Throws if not initialized.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initSupabase() first.');
  }
  return supabaseClient;
}

/**
 * Validate a player's JWT token against Supabase Auth.
 * Returns the user ID if valid, null otherwise.
 */
export async function validatePlayerToken(token: string): Promise<string | null> {
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Get player ID from auth ID.
 */
export async function getPlayerIdFromAuthId(authId: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('players')
    .select('id')
    .eq('auth_id', authId)
    .single();

  if (error || !data) return null;
  return data.id;
}
