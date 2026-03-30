import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://btzxosrbdkxzclpqdmxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bJQ2CGy7amMVsUEJyL6f-g_SnXJeF-n';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('produtos').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

run();
