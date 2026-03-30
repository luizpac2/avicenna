const SUPABASE_URL = 'https://btzxosrbdkxzclpqdmxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bJQ2CGy7amMVsUEJyL6f-g_SnXJeF-n';

async function fetchSchema() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_ANON_KEY
    }
  });
  const text = await res.text();
  console.log(text.substring(0, 5000));
}

fetchSchema().catch(console.error);
