import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // Check authorization header for Vercel Cron or manual request
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET token' });
  }

  // Get Supabase Environment Variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Execute 1 lightweight query to keep Supabase DB awake
    const { data, error } = await supabase.from('freelance_jobs').select('id').limit(1);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: '⚡ Heartbeat Keep-Alive query successfully executed on Supabase DB!',
      timestamp: new Date().toISOString(),
      recordCount: data?.length || 0
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal error' });
  }
}
