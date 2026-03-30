import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://btzxosrbdkxzclpqdmxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bJQ2CGy7amMVsUEJyL6f-g_SnXJeF-n';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsert() {
  const { data, error } = await supabase.from('produtos').insert([{ nome: 'teste', preco_venda: 0, sku: 'teste' }]);
  console.log('Error:', error);
}

testInsert();
