import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 'https://fmneiiaqwjnwcdjjeqrs.supabase.co';
const supabaseAnon = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbmVpaWFxd2pud2NkamplcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTg5MjksImV4cCI6MjA5Nzc3NDkyOX0.xfavhQ2XLw8FlEgxU2VlHEN88Bh-A5D78L8_1RnxcAs';

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // Persist session in localStorage (matches existing app behaviour)
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
