import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://btzxosrbdkxzclpqdmxc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bJQ2CGy7amMVsUEJyL6f-g_SnXJeF-n';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const pecas = [
  'Camiseta',
  'Baby Look',
  'Calça Moletom',
  'Calça Tactel',
  'Calça Helanca Bailarina',
  'Bermuda Tactel',
  'Bermuda Helanca',
  'Moletom',
  'Jaqueta',
  'Jaqueta Laranja',
  'Camisa Cursinho Einstein',
  'Aprovação 2025',
  'Aprovação'
];

async function insert() {
  for (const peca of pecas) {
    const { data, error } = await supabase
      .from('produtos')
      .insert({ peca, preco_unit: 0 });
    
    if (error) {
      console.error('Error inserting', peca, error);
    } else {
      console.log('Inserted', peca);
    }
  }
}

insert().then(() => console.log('Done'));
