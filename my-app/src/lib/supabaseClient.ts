import { createClient } from '@supabase/supabase-js'

// Read variables from import.meta.env (Vite specific)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  throw new Error('Supabase environment variables are not set.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 