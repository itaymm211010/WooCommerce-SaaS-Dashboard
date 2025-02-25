
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

declare global {
  interface Window {
    __RUNTIME_CONFIG__: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
    };
  }
}

const supabaseUrl = window.__RUNTIME_CONFIG__.VITE_SUPABASE_URL;
const supabaseAnonKey = window.__RUNTIME_CONFIG__.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
