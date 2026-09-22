import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) 
  ? import.meta.env.VITE_SUPABASE_URL 
  : 'https://wukpkztwjgkcmwiflylu.supabase.co';

const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) 
  ? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY 
  : 'sb_publishable_-yPJ_XRGL6GMIERJ9shMUg_WchKkIK8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
