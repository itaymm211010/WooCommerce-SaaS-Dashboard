
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = 'https://wzpbsridzmqrcztafzip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cGJzcmlkem1xcmN6dGFmemlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MDcxMjAsImV4cCI6MjA1NTk4MzEyMH0.Oxzh-NId5MAypfN8UUFPE5yhecT1HlXhan4iIU7jmpw';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
