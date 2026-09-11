import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://wukpkztwjgkcmwiflylu.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_-yPJ_XRGL6GMIERJ9shMUg_WchKkIK8';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
