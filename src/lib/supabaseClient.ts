import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://igeojwuwpyrevckxbmuc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZW9qd3V3cHlyZXZja3hibXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzg5NTksImV4cCI6MjA2ODYxNDk1OX0.CWDvDjWHBrAeP2RIs_ljqyCjxyIqUpT2rNQjGZ1MSAI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 