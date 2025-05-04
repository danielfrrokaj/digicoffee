import { createClient } from '@supabase/supabase-js'

// Ideally, these should be environment variables
const supabaseUrl = 'https://hyoqemqzauvoxtcnthqb.supabase.co'
// Use the actual anon key retrieved
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b3FlbXF6YXV2b3h0Y250aHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjAzNzcsImV4cCI6MjA2MTkzNjM3N30.UtZfjTQEoQBhAzbvSnNqtUz-oOq-cRppmjqyYuy84vM'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 