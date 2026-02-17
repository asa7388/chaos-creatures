// Chaos Creatures Admin Dashboard — Supabase Client
// TODO: Implement full client setup in Wave 2

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role (full access)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
