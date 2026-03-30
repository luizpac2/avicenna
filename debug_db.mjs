import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('As variáveis de ambiente não foram carregadas corretamente.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
  const { data, error } = await supabase
    .from('produtos')
    .select('id, peca, categoria, preco_unit')
    .order('peca')
  
  if (error) {
    console.error('Erro na query:', error)
  } else {
    console.log('--- CONTEÚDO DA TABELA PRODUTOS ---')
    data.forEach(p => {
      console.log(`[${p.peca}] -> Categoria: "${p.categoria}"`)
    })
  }
}

debug()
