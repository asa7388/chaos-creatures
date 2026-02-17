// Chaos Creatures Admin Dashboard — Supabase Client
// Server-side client with service role key (full access, bypasses RLS).
// Used by server components and API routes.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role (full access)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
